import { EventEmitter } from 'events';
import { Flow } from '../db';
import { StateManager } from './state-manager';
import { SlotFiller } from './slot-filler';
import { transcribeAudio } from '../integrations/stt';
import { synthesizeSpeech } from '../integrations/tts';
import { generateResponse } from '../integrations/llm';
import { checkSafetyGuardrails } from '../safety/guardrails';
import { RateLimiter } from '../safety/limiter';
import { saveTranscript, updateSessionStatus, updateSessionCollectedData } from '../db';
import { CostTracker } from '../utils/cost-tracker';
import { BranchDetectionService } from '../services/BranchDetectionService';
import { FieldCollectionService } from '../services/FieldCollectionService';

export class ConversationEngine extends EventEmitter {
  private sessionId: string;
  private flow: Flow;
  private stateManager: StateManager;
  private slotFiller: SlotFiller;
  private rateLimiter: RateLimiter;
  private costTracker: CostTracker;
  private branchDetectionService: BranchDetectionService;
  private fieldCollectionService: FieldCollectionService;
  private audioResponseCallback: (audioData: Buffer) => Promise<void>;
  private isActive: boolean = false;
  private startTime: Date;
  private activeBranchPath: string[] = [];
  private currentNodeId: string | null = null;

  constructor(
    sessionId: string,
    flow: Flow,
    audioResponseCallback: (audioData: Buffer) => Promise<void>
  ) {
    super();
    this.sessionId = sessionId;
    this.flow = flow;
    this.audioResponseCallback = audioResponseCallback;
    this.stateManager = new StateManager(sessionId, flow);
    this.slotFiller = new SlotFiller(flow);
    this.rateLimiter = new RateLimiter(sessionId);
    this.costTracker = new CostTracker(sessionId);
    this.branchDetectionService = new BranchDetectionService();
    this.fieldCollectionService = new FieldCollectionService();
    this.startTime = new Date();
  }

  async start(): Promise<void> {
    this.isActive = true;
    console.log(`Starting conversation for session ${this.sessionId}`);

    // Generate and send greeting
    const greeting = await this.generateGreeting();
    await this.sendBotMessage(greeting);

    await updateSessionStatus(this.sessionId, 'active');
  }

  private async generateGreeting(): Promise<string> {
    const context = {
      flow: this.flow,
      isGreeting: true,
    };

    const greeting = await generateResponse(
      '',
      this.flow.system_prompt,
      [],
      context
    );

    this.costTracker.trackLLMCall('gemini-2.5-flash', 0, greeting.length);

    return greeting;
  }

  async processUserAudio(audioBuffer: Buffer): Promise<void> {
    if (!this.isActive) return;

    try {
      // Check rate limits
      if (!this.rateLimiter.checkLimit()) {
        console.warn('Rate limit exceeded for session', this.sessionId);
        await this.handleRateLimitExceeded();
        return;
      }

      // Check time limit (10 minutes)
      const elapsed = Date.now() - this.startTime.getTime();
      if (elapsed > 10 * 60 * 1000) {
        console.warn('Time limit exceeded for session', this.sessionId);
        await this.handleTimeLimitExceeded();
        return;
      }

      // Transcribe audio
      const userText = await transcribeAudio(audioBuffer);
      console.log(`User said: ${userText}`);

      this.costTracker.trackSTTCall('azure-whisper', audioBuffer.length);

      // Save user transcript
      await saveTranscript({
        session_id: this.sessionId,
        speaker: 'user',
        text: userText,
        timestamp: new Date(),
      });

      // Process user input
      await this.processUserInput(userText);
    } catch (error) {
      console.error('Error processing user audio:', error);
      await this.sendBotMessage("I'm sorry, I didn't catch that. Could you please repeat?");
    }
  }

  private async processUserInput(userText: string): Promise<void> {
    // Add to conversation history
    this.stateManager.addUserMessage(userText);

    // Check safety guardrails
    const safetyCheck = checkSafetyGuardrails(userText);
    if (!safetyCheck.safe) {
      console.warn('Safety check failed:', safetyCheck.reason);
      await this.handleUnsafeContent(safetyCheck.reason);
      return;
    }

    // Check for escalation request
    if (this.detectEscalationRequest(userText)) {
      await this.handleEscalation();
      return;
    }

    // Check if we need to detect a branch (only if no branch is active yet)
    if (this.activeBranchPath.length === 0 && this.hasBranchingFlow()) {
      const branchDetected = await this.detectAndActivateBranch(userText);
      if (branchDetected) {
        // Branch detected, ask for branch-specific fields
        const response = await this.generateBranchConfirmation();
        await this.sendBotMessage(response);
        return;
      }
    }

    // Extract and validate slots
    const extractedSlots = await this.slotFiller.extractSlots(
      userText,
      this.stateManager.getCollectedData(),
      this.stateManager.getConversationHistory()
    );

    // Update state with extracted slots
    for (const [slotName, value] of Object.entries(extractedSlots)) {
      this.stateManager.setSlot(slotName, value);
    }

    // Validate collected fields against branch requirements
    if (this.activeBranchPath.length > 0) {
      await this.validateBranchFields();
    }

    // Save collected data
    await updateSessionCollectedData(
      this.sessionId,
      this.stateManager.getCollectedData()
    );

    // Check if all required slots are filled (considering active branch)
    const isComplete = await this.checkCompletionStatus();
    if (isComplete) {
      await this.handleConversationComplete();
      return;
    }

    // Generate next response
    const nextSlot = this.slotFiller.getNextMissingSlot(
      this.stateManager.getCollectedData()
    );

    const response = await this.generateContextualResponse(nextSlot);
    await this.sendBotMessage(response);
  }

  private async generateContextualResponse(nextSlot: string | null): Promise<string> {
    const conversationHistory = this.stateManager.getConversationHistory();
    const collectedData = this.stateManager.getCollectedData();

    const context = {
      flow: this.flow,
      collectedData,
      nextSlot,
      conversationHistory: conversationHistory.slice(-10), // Last 10 messages
    };

    const response = await generateResponse(
      conversationHistory[conversationHistory.length - 1]?.content || '',
      this.flow.system_prompt,
      conversationHistory.slice(0, -1),
      context
    );

    this.costTracker.trackLLMCall(
      'gemini-2.5-flash',
      JSON.stringify(conversationHistory).length,
      response.length
    );

    return response;
  }

  private async sendBotMessage(text: string): Promise<void> {
    console.log(`Bot says: ${text}`);

    // Add to conversation history
    this.stateManager.addBotMessage(text);

    // Save bot transcript
    await saveTranscript({
      session_id: this.sessionId,
      speaker: 'bot',
      text,
      timestamp: new Date(),
    });

    // Convert to speech
    const audioData = await synthesizeSpeech(text);
    this.costTracker.trackTTSCall('elevenlabs', text.length);

    // Send audio to LiveKit
    await this.audioResponseCallback(audioData);
  }

  private detectEscalationRequest(text: string): boolean {
    const escalationPatterns = [
      /connect.*consultant/i,
      /speak.*human/i,
      /talk.*person/i,
      /transfer.*agent/i,
      /need.*help/i,
      /representative/i,
    ];

    return escalationPatterns.some(pattern => pattern.test(text));
  }

  private async handleEscalation(): Promise<void> {
    console.log('Escalation requested');
    await updateSessionStatus(this.sessionId, 'escalated', {
      reason: 'user_requested',
      collectedData: this.stateManager.getCollectedData(),
    });

    await this.sendBotMessage(
      "I understand you'd like to speak with a consultant. Let me connect you with someone who can help. Please hold for a moment."
    );

    this.emit('escalation');
    await this.end();
  }

  private async handleConversationComplete(): Promise<void> {
    console.log('Conversation complete, all slots filled');
    await updateSessionStatus(this.sessionId, 'completed', {
      collectedData: this.stateManager.getCollectedData(),
      costs: this.costTracker.getSummary(),
    });

    await this.sendBotMessage(
      "Thank you! I have all the information I need. A consultant will contact you shortly to discuss your requirements."
    );

    this.emit('complete');
    await this.end();
  }

  private async handleUnsafeContent(reason: string): Promise<void> {
    console.warn('Unsafe content detected:', reason);
    await this.sendBotMessage(
      "I apologize, but I need to keep our conversation professional. Could we please continue with your request?"
    );
  }

  private async handleRateLimitExceeded(): Promise<void> {
    await updateSessionStatus(this.sessionId, 'rate_limited');
    await this.sendBotMessage(
      "I'm sorry, but there have been too many requests. Please try again in a few moments."
    );
    await this.end();
  }

  private async handleTimeLimitExceeded(): Promise<void> {
    await updateSessionStatus(this.sessionId, 'timeout', {
      collectedData: this.stateManager.getCollectedData(),
    });
    await this.sendBotMessage(
      "I apologize, but our conversation time has expired. A consultant will reach out to you to continue."
    );
    await this.end();
  }

  /**
   * Check if the flow has branching nodes
   */
  private hasBranchingFlow(): boolean {
    const flowDef = this.flow.flow_definition;
    if (!flowDef || !flowDef.nodes) return false;

    return flowDef.nodes.some((node: any) => node.type === 'branch');
  }

  /**
   * Detect which branch to activate based on user input
   */
  private async detectAndActivateBranch(userText: string): Promise<boolean> {
    const flowDef = this.flow.flow_definition;
    if (!flowDef || !flowDef.nodes) return false;

    // Find branch nodes
    const branchNodes = flowDef.nodes.filter((node: any) => node.type === 'branch');

    if (branchNodes.length === 0) return false;

    // For simplicity, use the first branch node
    const branchNode = branchNodes[0];

    if (!branchNode.data.branches || branchNode.data.branches.length === 0) {
      return false;
    }

    // Use BranchDetectionService to detect branch
    const sessionContext = {
      session_id: this.sessionId,
      flow_id: this.flow.id,
      current_node_id: branchNode.id,
      active_branch_path: this.activeBranchPath,
      collected_fields: this.stateManager.getCollectedData(),
      required_for_branch: [],
      missing_fields: [],
      validation_errors: {},
      created_at: this.startTime,
      updated_at: new Date(),
    };

    const detectionResult = await this.branchDetectionService.detectBranch(
      branchNode,
      userText,
      sessionContext
    );

    console.log('[BRANCH] Detection result:', {
      action: detectionResult.action,
      selected_branch: detectionResult.selected_branch,
      confidence: detectionResult.confidence,
    });

    if (detectionResult.action === 'proceed' && detectionResult.selected_branch) {
      // Activate this branch
      this.activeBranchPath.push(detectionResult.selected_branch);
      this.currentNodeId = branchNode.id;

      console.log('[BRANCH] Activated branch:', detectionResult.selected_branch);
      return true;
    }

    if (detectionResult.action === 'clarify' && detectionResult.clarification_prompt) {
      // Ask for clarification
      await this.sendBotMessage(detectionResult.clarification_prompt);
      return false;
    }

    // Re-prompt if unclear
    return false;
  }

  /**
   * Generate confirmation message for selected branch
   */
  private async generateBranchConfirmation(): Promise<string> {
    if (this.activeBranchPath.length === 0) {
      return "Let me help you with that.";
    }

    const branchId = this.activeBranchPath[0];
    const flowDef = this.flow.flow_definition;

    if (!flowDef || !flowDef.nodes) {
      return "I understand. Let me collect some information.";
    }

    // Find the branch configuration
    const branchNodes = flowDef.nodes.filter((node: any) => node.type === 'branch');
    if (branchNodes.length === 0) return "Let me help you with that.";

    const branchNode = branchNodes[0];
    const branch = branchNode.data.branches?.find((b: any) => b.id === branchId);

    if (branch) {
      return `I understand this is about ${branch.name}. Let me collect the necessary information.`;
    }

    return "I understand. Let me collect some information.";
  }

  /**
   * Validate collected fields against branch requirements
   */
  private async validateBranchFields(): Promise<void> {
    if (this.activeBranchPath.length === 0) return;

    const branchId = this.activeBranchPath[0];
    const flowDef = this.flow.flow_definition;

    if (!flowDef || !flowDef.nodes) return;

    const branchNodes = flowDef.nodes.filter((node: any) => node.type === 'branch');
    if (branchNodes.length === 0) return;

    const branchNode = branchNodes[0];
    const branches = branchNode.data.branches || [];

    // Use FieldCollectionService to validate
    const collectedData = this.stateManager.getCollectedData();

    for (const [fieldName, value] of Object.entries(collectedData)) {
      const fieldConfig = this.flow.required_fields.find(f => f.name === fieldName);

      if (fieldConfig && fieldConfig.validation) {
        const validationResult = await this.fieldCollectionService.validateField(
          fieldConfig,
          value
        );

        if (!validationResult.valid) {
          console.warn('[VALIDATION] Field validation failed:', {
            field: fieldName,
            errors: validationResult.errors,
          });
        }
      }
    }
  }

  /**
   * Check if conversation is complete based on active branch requirements
   */
  private async checkCompletionStatus(): Promise<boolean> {
    // If no branch is active, use default completion check
    if (this.activeBranchPath.length === 0) {
      return this.stateManager.isComplete();
    }

    const branchId = this.activeBranchPath[0];
    const flowDef = this.flow.flow_definition;

    if (!flowDef || !flowDef.nodes) {
      return this.stateManager.isComplete();
    }

    const branchNodes = flowDef.nodes.filter((node: any) => node.type === 'branch');
    if (branchNodes.length === 0) {
      return this.stateManager.isComplete();
    }

    const branchNode = branchNodes[0];
    const branches = branchNode.data.branches || [];

    // Check if branch-specific fields are complete
    const isComplete = this.fieldCollectionService.isCollectionComplete(
      branchId,
      branches,
      this.flow.required_fields,
      this.stateManager.getCollectedData()
    );

    console.log('[BRANCH] Completion check:', {
      branchId,
      isComplete,
      collected: Object.keys(this.stateManager.getCollectedData()),
    });

    return isComplete;
  }

  async end(): Promise<void> {
    this.isActive = false;
    console.log(`Ending conversation for session ${this.sessionId}`);
    console.log('Cost summary:', this.costTracker.getSummary());
    console.log('Active branch:', this.activeBranchPath);
    this.emit('end');
  }
}

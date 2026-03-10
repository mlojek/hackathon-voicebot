import React, { useState } from 'react';
import ConversationalCreator from './components/ConversationalCreator';
import FlowEditor from './components/FlowEditor';
import TestConsole from './components/TestConsole-simple';
import VersionHistory from './components/VersionHistory-simple';
import { Save, Eye, EyeOff } from 'lucide-react';

interface Flow {
  nodes: any[];
  edges: any[];
  collectionSequence?: Array<{
    fieldName: string;
    order: number;
  }>;
}

interface Field {
  name: string;
  type: string;
  label: string;
  required: boolean;
  validation?: any;
  promptTemplate: string;
}

interface GeneratedConfig {
  prompt: string;
  fields: Field[];
  flow: Flow;
}

type Tab = 'create' | 'prompt' | 'fields' | 'flow' | 'test' | 'versions';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('create');
  const [config, setConfig] = useState<GeneratedConfig | null>(null);
  const [botName, setBotName] = useState('Nowy Voicebot');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleGenerate = (generated: GeneratedConfig) => {
    setConfig(generated);
    setHasUnsavedChanges(true);
    setShowAdvanced(true);
  };

  const handleSave = async () => {
    if (!config) return;
    try {
      console.log('Saving...', { botName, config });
      setHasUnsavedChanges(false);
      alert('Bot zapisany!');
    } catch (error) {
      alert('Błąd zapisu');
    }
  };

  const handlePublish = async () => {
    if (!config) return;
    if (!window.confirm('Opublikować bota?')) return;
    try {
      console.log('Publishing...', { botName, config });
      setHasUnsavedChanges(false);
      alert('Bot opublikowany!');
    } catch (error) {
      alert('Błąd publikacji');
    }
  };

  const updatePrompt = (prompt: string) => {
    if (config) {
      setConfig({ ...config, prompt });
      setHasUnsavedChanges(true);
    }
  };

  const updateFields = (fields: Field[]) => {
    if (config) {
      setConfig({ ...config, fields });
      setHasUnsavedChanges(true);
    }
  };

  const updateFlow = (flow: Flow) => {
    if (config) {
      setConfig({ ...config, flow });
      setHasUnsavedChanges(true);
    }
  };

  const tabs = [
    { id: 'create', label: '💬 Konwersacja', desc: 'Opisz lub zmień' },
    ...(showAdvanced ? [
      { id: 'prompt', label: '✍️ Prompt', desc: 'System prompt' },
      { id: 'fields', label: '📝 Pola', desc: 'Dane' },
      { id: 'flow', label: '📊 Flow', desc: 'Kolejność' },
      { id: 'test', label: '🧪 Test', desc: 'Wypróbuj' },
      { id: 'versions', label: '📜 Wersje', desc: 'Historia' },
    ] : []) as Array<{ id: Tab; label: string; desc: string }>,
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <input
                type="text"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                className="text-xl font-bold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2"
              />
              {hasUnsavedChanges && (
                <span className="text-sm text-orange-600">• Niezapisane</span>
              )}
            </div>
            <div className="flex gap-3">
              {config && (
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
                >
                  {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showAdvanced ? 'Ukryj' : 'Pokaż'} zaawansowane
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!config || !hasUnsavedChanges}
                className="flex items-center gap-2 px-5 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Zapisz
              </button>
              <button
                onClick={handlePublish}
                disabled={!config}
                className="px-5 py-2 text-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:shadow-lg disabled:opacity-50"
              >
                Opublikuj
              </button>
            </div>
          </div>
        </div>
      </header>

      {showAdvanced && (
        <div className="bg-white border-b sticky top-[73px] z-40">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-3 text-sm font-medium border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600'
                  }`}
                >
                  <div>
                    <span>{tab.label}</span>
                    <span className="text-xs block opacity-75">{tab.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {activeTab === 'create' && (
            <ConversationalCreator onGenerate={handleGenerate} currentConfig={config || undefined} />
          )}
          {activeTab === 'prompt' && config && (
            <div className="bg-white rounded-xl p-6 border">
              <h2 className="text-xl font-bold mb-4">System Prompt</h2>
              <textarea
                value={config.prompt}
                onChange={(e) => updatePrompt(e.target.value)}
                className="w-full min-h-[500px] px-4 py-3 border rounded-lg font-mono text-sm"
              />
            </div>
          )}
          {activeTab === 'fields' && config && (
            <div className="bg-white rounded-xl p-6 border">
              <h2 className="text-xl font-bold mb-4">Required Fields</h2>
              <div className="space-y-4">
                {config.fields.map((field, idx) => (
                  <div key={idx} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{field.label}</h3>
                        <p className="text-sm text-gray-500">{field.name} - {field.type}</p>
                        {field.required && <span className="text-xs text-red-600">* Required</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'flow' && config && (
            <FlowEditor flow={config.flow} onChange={updateFlow} fields={config.fields} />
          )}
          {activeTab === 'test' && config && (
            <TestConsole flow={config.flow} prompt={config.prompt} fields={config.fields} />
          )}
          {activeTab === 'versions' && <VersionHistory />}
        </div>
      </main>
    </div>
  );
}

export default App;

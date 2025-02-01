import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ChevronRight, X } from 'lucide-react';

const AddCustomService = ({ existingService = null, onClose, onSave }) => {
  const isEditMode = !!existingService;
  const [step, setStep] = useState('input');
  const [serviceName, setServiceName] = useState(existingService?.name || '');
  const [rawOrder, setRawOrder] = useState(existingService?.order || '');
  const [parsedElements, setParsedElements] = useState(existingService?.elements || []);

  const parseOrderOfWorship = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    
    return lines.map(line => {
      let type = 'liturgy';
      let content = line;
      let reference = '';
      let note = '';

      if (line.includes('Hymn') || line.includes('Song') || 
          line.includes('Kyrie') || line.includes('Alleluia')) {
        type = 'hymn';
        const matches = line.match(/\((.*?)\)/);
        if (matches) {
          reference = matches[1];
          content = line.replace(`(${reference})`, '').trim();
        }
      }
      else if (line.includes('Reading') || line.includes('Psalm')) {
        type = 'reading';
        const colonIndex = line.indexOf(':');
        if (colonIndex > -1) {
          content = line.substring(0, colonIndex + 1).trim();
          reference = line.substring(colonIndex + 1).trim();
        }
      }
      else if (line.includes('Sermon') || line.includes('Message')) {
        type = 'message';
      }

      const noteMatch = line.match(/\((.*?)\)/);
      if (noteMatch) {
        note = noteMatch[1];
        content = line.replace(`(${note})`, '').trim();
      }

      return { type, content, reference, note };
    });
  };

  const ElementTypeSelect = ({ element, index, onChange }) => (
    <select
      value={element.type}
      onChange={(e) => onChange(index, { ...element, type: e.target.value })}
      className="text-xs border rounded p-1"
    >
      <option value="liturgy">Liturgy</option>
      <option value="hymn">Hymn</option>
      <option value="reading">Reading</option>
      <option value="message">Message</option>
    </select>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl bg-white rounded-lg shadow-xl">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-[#6B8E23]">
              {isEditMode ? 'Edit' : 'Add'} Custom Service
            </h2>
            <button 
              onClick={onClose}
              className="p-2 text-[#6B8E23] hover:bg-[#6B8E23] hover:bg-opacity-20 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {step === 'input' ? (
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-lg font-bold text-[#6B8E23] mb-2">
                Service Name
              </label>
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="e.g., Good Friday"
                className="w-full p-3 border rounded hover:border-[#6B8E23] focus:border-[#6B8E23] focus:ring-1 focus:ring-[#6B8E23]"
              />
            </div>

            <div>
              <label className="block text-lg font-bold text-[#6B8E23] mb-2">
                Order of Worship
              </label>
              <textarea
                value={rawOrder}
                onChange={(e) => setRawOrder(e.target.value)}
                placeholder="Paste the Order of Worship..."
                className="w-full h-64 p-3 border rounded font-mono text-sm resize-none hover:border-[#6B8E23] focus:border-[#6B8E23] focus:ring-1 focus:ring-[#6B8E23]"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  if (serviceName && rawOrder) {
                    const elements = parseOrderOfWorship(rawOrder);
                    setParsedElements(elements);
                    setStep('review');
                  }
                }}
                disabled={!serviceName || !rawOrder}
                className="flex items-center gap-2 px-4 py-2 rounded bg-[#6B8E23] text-white hover:bg-[#556B2F] disabled:bg-gray-200 disabled:text-gray-500"
              >
                Review Elements
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <h3 className="text-lg font-bold text-[#6B8E23] mb-4">Review Service Elements</h3>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {parsedElements.map((element, index) => (
                <div key={index} className="flex items-start gap-3 p-2 border rounded">
                  <ElementTypeSelect 
                    element={element}
                    index={index}
                    onChange={(idx, updated) => {
                      const newElements = [...parsedElements];
                      newElements[idx] = updated;
                      setParsedElements(newElements);
                    }}
                  />
                  <div className="flex-1">
                    <input
                      value={element.content}
                      onChange={(e) => {
                        const newElements = [...parsedElements];
                        newElements[index] = { ...element, content: e.target.value };
                        setParsedElements(newElements);
                      }}
                      className="w-full p-1 border rounded text-sm hover:border-[#6B8E23] focus:border-[#6B8E23] focus:ring-1 focus:ring-[#6B8E23]"
                    />
                    {(element.reference || element.type === 'hymn' || element.type === 'reading') && (
                      <input
                        value={element.reference}
                        onChange={(e) => {
                          const newElements = [...parsedElements];
                          newElements[index] = { ...element, reference: e.target.value };
                          setParsedElements(newElements);
                        }}
                        placeholder="Reference (e.g., hymn number or Bible verse)"
                        className="w-full mt-1 p-1 border rounded text-xs hover:border-[#6B8E23] focus:border-[#6B8E23] focus:ring-1 focus:ring-[#6B8E23]"
                      />
                    )}
                    {element.note && (
                      <input
                        value={element.note}
                        onChange={(e) => {
                          const newElements = [...parsedElements];
                          newElements[index] = { ...element, note: e.target.value };
                          setParsedElements(newElements);
                        }}
                        placeholder="Notes"
                        className="w-full mt-1 p-1 border rounded text-xs hover:border-[#6B8E23] focus:border-[#6B8E23] focus:ring-1 focus:ring-[#6B8E23]"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 border-t bg-[#FFD700] bg-opacity-10 flex justify-between">
          {step === 'review' && (
            <button
              onClick={() => setStep('input')}
              className="px-4 py-2 border border-[#6B8E23] text-[#6B8E23] rounded hover:bg-[#6B8E23] hover:text-white"
            >
              Back to Edit
            </button>
          )}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[#6B8E23] text-[#6B8E23] rounded hover:bg-[#6B8E23] hover:text-white"
            >
              Cancel
            </button>
            {step === 'review' && (
              <button
                onClick={() => {
                  onSave({
                    name: serviceName,
                    elements: parsedElements
                  });
                }}
                className="px-4 py-2 bg-[#6B8E23] text-white rounded hover:bg-[#556B2F]"
              >
                Save Custom Service
              </button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AddCustomService;
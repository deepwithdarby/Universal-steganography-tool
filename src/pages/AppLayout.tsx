import { useState } from 'react';
import TextTool from '../components/steganography/TextTool';
import ImageTool from '../components/steganography/ImageTool';
import AudioTool from '../components/steganography/AudioTool';
import VideoTool from '../components/steganography/VideoTool';

type Tab = 'text' | 'image' | 'audio' | 'video';

const AppLayout = () => {
  const [activeTab, setActiveTab] = useState<Tab>('text');

  const tabs: { id: Tab; label: string; disabled: boolean, tooltip: string }[] = [
    { id: 'text', label: 'Text Steganography', disabled: false, tooltip: '' },
    { id: 'image', label: 'Image Steganography', disabled: false, tooltip: '' },
    { id: 'audio', label: 'Audio Steganography', disabled: false, tooltip: '' },
    { id: 'video', label: 'Video Steganography', disabled: false, tooltip: 'This feature is experimental and may not work reliably.' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'text':
        return <TextTool />;
      case 'image':
        return <ImageTool />;
      case 'audio':
        return <AudioTool />;
      case 'video':
        return <VideoTool />;
      default:
        return <p>Select a tool to get started.</p>;
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
        <h1 className="text-3xl font-bold mb-6 text-center">Steganography Workspace</h1>

        <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
          <nav className="-mb-px flex flex-wrap -mx-4" aria-label="Tabs">
            {tabs.map(tab => (
              <div key={tab.id} className="relative group">
                <button
                  onClick={() => !tab.disabled && setActiveTab(tab.id)}
                  disabled={tab.disabled}
                  className={`
                    whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm
                    ${activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                    ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {tab.label}
                </button>
                {tab.disabled && tab.tooltip && (
                  <div className="absolute z-10 bottom-full mb-2 w-64 p-2 text-sm text-white bg-gray-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {tab.tooltip}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        <div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AppLayout;

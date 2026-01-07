'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignal, faTimes, faPlus, faImage, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ResearchPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Research form state
  const [researchForm, setResearchForm] = useState({ 
    title: '',
    description: '',
    link: '', 
    author: '', 
    pdfUrl: '',
    imageUrl: '',
    tags: []
  });
  const [researchSubmitting, setResearchSubmitting] = useState(false);
  const [researchSubmitMessage, setResearchSubmitMessage] = useState('');
  const [researchSubmitError, setResearchSubmitError] = useState(false);

  // Fetch research items
  const { data: researchData, error: researchError, mutate: mutateResearch } = useSWR('/api/research', fetcher);

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Handle image upload
  const uploadImage = async (): Promise<string | null> => {
    if (!selectedImage) return null;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('name', `research-${Date.now()}`);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        return result.data.display_url;
      }
      throw new Error('Upload failed');
    } catch (error) {
      console.error('Image upload error:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Handle research form submission
  const handleResearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResearchSubmitting(true);
    setResearchSubmitMessage('');
    setResearchSubmitError(false);

    try {
      // Upload image if selected
      let imageUrl = researchForm.imageUrl;
      if (selectedImage) {
        imageUrl = await uploadImage() || '';
      }

      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...researchForm,
          imageUrl
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResearchSubmitMessage('Research submitted for approval!');
        setResearchForm({ 
          title: '',
          description: '',
          link: '', 
          author: '', 
          pdfUrl: '',
          imageUrl: '',
          tags: []
        });
        setSelectedImage(null);
        setImagePreview(null);
        mutateResearch(); // Refresh the research list
        setIsModalOpen(false); // Close modal on success
      } else {
        throw new Error(data.error || 'Failed to add research');
      }
    } catch (error) {
      setResearchSubmitError(true);
      setResearchSubmitMessage('Error adding research. Please try again.');
    } finally {
      setResearchSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="terminal-panel mb-6">
        <h2 className="terminal-header text-2xl">📚 Research Papers</h2>
        <p className="text-gray-400 text-sm mt-2">
          Academic papers, DeFi research, blockchain analysis, and market studies
        </p>
      </div>

      {/* Add Research Button */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-terminal-accent text-black font-medium rounded hover:bg-terminal-accent/80 transition-colors flex items-center space-x-2"
        >
          <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
          <span>Add New Research</span>
        </button>
        <div className="text-sm text-gray-400">
          💡 Track your submission status in <strong className="text-terminal-accent">Submissions</strong> (ALT+6)
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Real research data */}
        {researchError ? (
          <div className="col-span-full text-center py-8">
            <div className="text-gray-400 mb-2">⚠️</div>
            <p className="text-gray-400">Failed to load research.</p>
            <p className="text-sm text-gray-500 mt-1">Please refresh and try again.</p>
          </div>
        ) : !researchData ? (
          <div className="col-span-full text-center py-8">
            <div className="text-gray-400 mb-2">⏳</div>
            <p className="text-gray-400">Loading research…</p>
          </div>
        ) : Array.isArray(researchData?.research) && researchData.research.length > 0 ? (
          researchData.research.map((item: any, idx: number) => {
            const title = item.title || item.link || `Research #${idx + 1}`;
            const description = item.description || item.message || '';
            const date = item.date || item.createdAt || '';
            const category = item.category || '';

            return (
              <div key={item._id || item.messageId || idx} className="bg-terminal-bg rounded-lg border border-terminal-border overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-terminal-accent mb-1">{title}</h3>
                      {description && <p className="text-xs text-gray-400 mb-2">{description}</p>}
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        {date && <span>📅 {new Date(date).toLocaleDateString()}</span>}
                        {date && category && <span>•</span>}
                        {category && <span>{category}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <FontAwesomeIcon icon={faSignal} className="w-3 h-3 text-terminal-accent" />
                      <span className="text-xs text-terminal-accent">{item.author || 'Unknown'}</span>
                    </div>
                    <a
                      href={item.link || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-terminal-accent text-black text-xs font-medium rounded hover:bg-terminal-accent/80 transition-colors"
                    >
                      📄 View Research
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-8">
            <div className="text-gray-400 mb-2">📄</div>
            <p className="text-gray-400">No research available yet.</p>
            <p className="text-sm text-gray-500 mt-1">Be the first to submit research content!</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-terminal-bg rounded-lg border border-terminal-border p-6 w-full max-w-md max-h-[85vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-terminal-accent">📤 Add New Research</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-terminal-accent"
              >
                <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleResearchSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-terminal-accent mb-2">Title</label>
                <input
                  type="text"
                  value={researchForm.title}
                  onChange={(e) => setResearchForm({ ...researchForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent placeholder-gray-500 focus:outline-none focus:border-terminal-accent"
                  placeholder="Research paper title"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-terminal-accent mb-2">Description (Optional)</label>
                <textarea
                  value={researchForm.description}
                  onChange={(e) => setResearchForm({ ...researchForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent placeholder-gray-500 focus:outline-none focus:border-terminal-accent h-20 resize-none"
                  placeholder="Brief description of the research"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-terminal-accent mb-2">Research Link (URL)</label>
                <input
                  type="url"
                  value={researchForm.link}
                  onChange={(e) => setResearchForm({ ...researchForm, link: e.target.value })}
                  className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent placeholder-gray-500 focus:outline-none focus:border-terminal-accent"
                  placeholder="https://example.com/research-page"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-terminal-accent mb-2">PDF Link (Optional)</label>
                <input
                  type="url"
                  value={researchForm.pdfUrl}
                  onChange={(e) => setResearchForm({ ...researchForm, pdfUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent placeholder-gray-500 focus:outline-none focus:border-terminal-accent"
                  placeholder="https://example.com/research.pdf"
                />
                <div className="flex items-center mt-1 text-xs text-gray-400">
                  <FontAwesomeIcon icon={faFilePdf} className="w-3 h-3 mr-1" />
                  Direct link to PDF file
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-terminal-accent mb-2">Cover Image (Optional)</label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:bg-terminal-accent file:text-black file:text-sm hover:file:bg-terminal-accent/80"
                  />
                  {imagePreview && (
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-32 object-cover rounded border border-terminal-border"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview(null);
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  <div className="flex items-center text-xs text-gray-400">
                    <FontAwesomeIcon icon={faImage} className="w-3 h-3 mr-1" />
                    Max 32MB, JPEG/PNG/GIF/WebP
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-terminal-accent mb-2">Author</label>
                <input
                  type="text"
                  value={researchForm.author}
                  onChange={(e) => setResearchForm({ ...researchForm, author: e.target.value })}
                  className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent placeholder-gray-500 focus:outline-none focus:border-terminal-accent"
                  placeholder="Author name"
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={researchSubmitting || uploading}
                  className="flex-1 px-4 py-2 bg-terminal-accent text-black font-medium rounded hover:bg-terminal-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading Image...' : researchSubmitting ? 'Submitting...' : 'Add Research'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-terminal-panel border border-terminal-border text-terminal-accent rounded hover:bg-terminal-border transition-colors"
                >
                  Cancel
                </button>
              </div>
              {researchSubmitMessage && (
                <p className={`text-sm ${researchSubmitError ? 'text-red-400' : 'text-green-400'}`}>
                  {researchSubmitMessage}
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

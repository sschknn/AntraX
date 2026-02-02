
import React from 'react';

interface FileUploaderProps {
  label: string;
  image: string | null;
  onUpload: (base64: string) => void;
  description: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ label, image, onUpload, description }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpload(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">{label}</label>
      <div 
        className={`relative group h-64 w-full rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center overflow-hidden
          ${image ? 'border-indigo-400 bg-white' : 'border-slate-300 bg-slate-50 hover:border-indigo-300 hover:bg-white'}
        `}
      >
        {image ? (
          <>
            <img src={image} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-sm font-medium">Change Photo</span>
            </div>
          </>
        ) : (
          <div className="p-8 text-center">
            <div className="bg-indigo-100 p-3 rounded-full inline-block mb-3">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-sm text-slate-600 mb-1">Click to upload or drag and drop</p>
            <p className="text-xs text-slate-400">{description}</p>
          </div>
        )}
        <input 
          type="file" 
          accept="image/*"
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

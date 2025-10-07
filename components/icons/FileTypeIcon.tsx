import React from 'react';

interface FileTypeIconProps {
    type: 'TXT' | 'DOCX' | 'PDF';
}

export const FileTypeIcon: React.FC<FileTypeIconProps> = ({ type }) => {
    return (
        <span className="text-xs font-mono bg-white bg-opacity-20 rounded-sm px-1">{type}</span>
    );
};

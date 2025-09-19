import { FileIcon, XIcon } from './icons';

export function FilePreview({ file, onClear }) {
  const isImage = file.type.startsWith('image/');
  const fileSize = (file.size / 1024).toFixed(2); // in KB

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: 8,
      borderRadius: 8,
      background: '#f1f3f5',
      marginBottom: 8,
      maxWidth: 400,
    }}>
      {isImage ? (
        <img src={file.data} alt="preview" style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover' }} />
      ) : (
        <div style={{ padding: 8 }}><FileIcon /></div>
      )}
      <div style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
        <div style={{ fontWeight: 500 }}>{file.name}</div>
        <div style={{ fontSize: 12, color: '#666' }}>{file.type} ({fileSize} KB)</div>
      </div>
      <button onClick={onClear} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
        <XIcon />
      </button>
    </div>
  );
}
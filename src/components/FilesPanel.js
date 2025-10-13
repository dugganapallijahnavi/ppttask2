import React, { useRef, useState } from 'react';

const statusConfig = {
  success: 'success',
  error: 'error',
  info: 'info'
};

const FilesPanel = ({
  sharePayload,
  onDownload,
  onCopyShare,
  onImport
}) => {
  const importInputRef = useRef(null);
  const [downloadStatus, setDownloadStatus] = useState(null);
  const [copyStatus, setCopyStatus] = useState(null);
  const [importStatus, setImportStatus] = useState(null);
  const [isCopying, setIsCopying] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleDownloadClick = () => {
    const result = onDownload?.();
    if (result?.status === statusConfig.error) {
      setDownloadStatus({
        type: statusConfig.error,
        message: result?.message || 'Download failed.'
      });
      return;
    }
    setDownloadStatus({
      type: statusConfig.success,
      message: 'Download started. Check your downloads folder.'
    });
  };

  const handleCopyClick = async () => {
    if (!sharePayload) {
      setCopyStatus({
        type: statusConfig.error,
        message: 'Nothing to copy yet.'
      });
      return;
    }

    try {
      setIsCopying(true);
      await (onCopyShare?.() ?? Promise.resolve());
      setCopyStatus({
        type: statusConfig.success,
        message: 'Presentation data copied to clipboard.'
      });
    } catch (error) {
      setCopyStatus({
        type: statusConfig.error,
        message: error?.message || 'Unable to copy data. Copy manually.'
      });
    } finally {
      setIsCopying(false);
    }
  };

  const handleImportRequest = () => {
    importInputRef.current?.click();
  };

  const handleImportChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setIsImporting(true);
      const result = await (onImport?.(file) ?? Promise.resolve());
      const importedCount =
        typeof result?.count === 'number' ? result.count : null;
      const countMessage =
        importedCount !== null
          ? `${importedCount} slide${importedCount === 1 ? '' : 's'}`
          : 'presentation';
      setImportStatus({
        type: statusConfig.success,
        message: `Imported ${countMessage}.`
      });
    } catch (error) {
      setImportStatus({
        type: statusConfig.error,
        message: error?.message || 'Unable to import presentation.'
      });
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  return (
    <div className="files-panel">
      <section>
        <div className="files-panel-heading">
          <div>
            <h4>Save presentation</h4>
            <p>Download a JSON snapshot you can restore later.</p>
          </div>
          <button type="button" onClick={handleDownloadClick}>
            Download JSON
          </button>
        </div>
        {downloadStatus && (
          <p className={`files-feedback ${downloadStatus.type}`}>
            {downloadStatus.message}
          </p>
        )}
      </section>

      <section>
        <div className="files-panel-heading">
          <div>
            <h4>Share data</h4>
            <p>Copy the structured data to share with teammates.</p>
          </div>
          <button
            type="button"
            onClick={handleCopyClick}
            disabled={isCopying}
          >
            {isCopying ? 'Copying...' : 'Copy data'}
          </button>
        </div>
        <textarea
          readOnly
          value={sharePayload || 'No data to show yet.'}
          aria-label="Presentation data"
        />
        {copyStatus && (
          <p className={`files-feedback ${copyStatus.type}`}>
            {copyStatus.message}
          </p>
        )}
      </section>

      <section>
        <div className="files-panel-heading">
          <div>
            <h4>Import presentation</h4>
            <p>Select a JSON export created with this app.</p>
          </div>
          <button
            type="button"
            onClick={handleImportRequest}
            disabled={isImporting}
          >
            {isImporting ? 'Opening...' : 'Open file'}
          </button>
        </div>
        <input
          ref={importInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImportChange}
          style={{ display: 'none' }}
        />
        {importStatus && (
          <p className={`files-feedback ${importStatus.type}`}>
            {importStatus.message}
          </p>
        )}
      </section>
    </div>
  );
};

export default FilesPanel;

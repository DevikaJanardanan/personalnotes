import Modal from './Modal';

/** "Are you sure?" box used before deleting things. */
export default function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onCancel, busy }) {
  return (
    <Modal onClose={onCancel} label={title} className="modal--small">
      <h2 className="modal__title">{title}</h2>
      <p className="modal__text">{message}</p>
      <div className="btn-row btn-row--end">
        <button className="btn btn--ghost" onClick={onCancel} autoFocus>
          Cancel
        </button>
        <button className="btn btn--danger-solid" onClick={onConfirm} disabled={busy}>
          {busy ? 'Deleting…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

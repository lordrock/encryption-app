import "../chatpage.css";

export default function SecureBadge() {
  return (
    <div className="secure-badge" title="Messages are encrypted before leaving this browser">
      🔒 End-to-end encrypted
    </div>
  );
}
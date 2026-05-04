export default function MessageBubble({ message, isOwn }) {
  return (
    <div className={`wb-bubble-row ${isOwn ? "wb-bubble-row--out" : "wb-bubble-row--in"}`}>
      <div className={`wb-bubble ${isOwn ? "wb-bubble--out" : "wb-bubble--in"}`}>
        {message.text}
        <div className="wb-bubble__time">
          {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}
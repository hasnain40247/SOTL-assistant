interface ChatMessageCardProps {
    role: 'user' | 'assistant';
    content: string;
  }

  import { Streamdown } from 'streamdown'
  function ScoutingLoader() {
    return (
      <div className="flex items-center space-x-3">
        {/* Spinning ring */}
        <div className="w-5 h-5 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
  
        {/* Fading text */}
        <span className="text-sm text-gray-300 animate-pulse">
          Scouting SoTL literature…
        </span>
      </div>
    );
  }
  
  
  
  export default function ChatMessageCard({ role, content }: ChatMessageCardProps) {
    const imageSrc = role === 'user' ? '/user.png' : '/system.png';
    const name = role === 'user' ? 'You' : 'Claude';
    const isScouting =
    role === 'assistant' &&
    content.trim() === 'Scouting SoTL literature…';
  
    return (
      <div className="flex items-start w-full space-x-4 ">
        <img
          src={imageSrc}
          alt={name}
          className="w-8 h-8 rounded-full mt-1 shrink-0"
        />
  
        <div
          className={`px-4 py-3 w-full rounded-tl-md rounded-tr-2xl rounded-bl-2xl rounded-br-2xl ${
            role === 'user'
              ? 'bg-zinc-800  text-[#F2F2F2]'
              : 'bg-zinc-700 text-[#F2F2F2]'
          }`}
        >
          <div className="text-xs text-gray-400 mb-1">{name}</div>
          {/* <div className="whitespace-pre-wrap">{content}</div> */}
          {/* <Streamdown>{content}</Streamdown> */}
          {isScouting ? <ScoutingLoader /> :
          <div className="streamdown-content">
           <Streamdown>{content}</Streamdown> </div>}
        </div>
      </div>
    );
  }
  
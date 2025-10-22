interface MessageContentProps {
  content: string;
  role: "user" | "assistant";
}

const MessageContent = ({ content, role }: MessageContentProps) => {
  // Parse markdown-like formatting
  const formatContent = (text: string) => {
    const lines = text.split("\n");
    const formatted: JSX.Element[] = [];

    lines.forEach((line, index) => {
      // Heading
      if (line.startsWith("# ")) {
        formatted.push(
          <h1 key={index} className="text-2xl font-bold mt-4 mb-2">
            {line.substring(2)}
          </h1>
        );
      }
      // Subheading
      else if (line.startsWith("## ")) {
        formatted.push(
          <h2 key={index} className="text-xl font-semibold mt-3 mb-2">
            {line.substring(3)}
          </h2>
        );
      }
      // Bold and italic
      else {
        const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);
        const formattedLine = parts.map((part, i) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={i} className="font-bold">
                {part.slice(2, -2)}
              </strong>
            );
          } else if (part.startsWith("*") && part.endsWith("*")) {
            return (
              <em key={i} className="italic">
                {part.slice(1, -1)}
              </em>
            );
          }
          return part;
        });

        if (line.trim()) {
          formatted.push(
            <p key={index} className="mb-2">
              {formattedLine}
            </p>
          );
        } else {
          formatted.push(<br key={index} />);
        }
      }
    });

    return formatted;
  };

  return <div className="prose prose-sm max-w-none">{formatContent(content)}</div>;
};

export default MessageContent;
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

type MarkdownProps = React.ComponentProps<typeof ReactMarkdown> & {
  className?: string;
};

// Componente Markdown que renderiza o conteúdo em Markdown usando ReactMarkdown e remarkGfm
export function Markdown({ className, ...props }: MarkdownProps) {
  return (
    <div
      className={cn(
        "space-y-3 text-sm leading-6 [&_a]:text-primary [&_a]:underline [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-4 [&_ul]:list-disc [&_ul]:pl-6",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} {...props} />
    </div>
  );
}

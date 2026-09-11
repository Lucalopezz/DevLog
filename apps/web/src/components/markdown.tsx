import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

type MarkdownProps = React.ComponentProps<typeof ReactMarkdown> & {
  className?: string;
};

// Renders Markdown content using ReactMarkdown and remarkGfm. The wrapper
// owns typography, block spacing, and element styles so every feature gets
// the same reading experience without duplicating Markdown configuration.
export function Markdown({ className, ...props }: MarkdownProps) {
  return (
    <div
      className={cn(
        "space-y-3 break-words text-sm leading-6 [&_a]:break-words [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_del]:line-through [&_em]:italic [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold [&_hr]:border-border [&_input]:mr-2 [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:leading-7 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-4 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_strong]:font-semibold [&_table]:block [&_table]:w-full [&_table]:overflow-x-auto [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_ul]:list-disc [&_ul]:pl-6",
        className,
      )}
    >
      {/* Keep GFM enabled after spreading props so callers cannot accidentally
          replace the plugin and lose tables, task lists, or strikethrough. */}
      <ReactMarkdown {...props} remarkPlugins={[remarkGfm]} />
    </div>
  );
}

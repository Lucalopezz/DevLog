import { useEffect, useState } from "react";

type DiagramResult =
  | { source: string; status: "ready"; svg: string; title?: string; description?: string }
  | { source: string; status: "error" };

let diagramNumber = 0;
let mermaidLoader: Promise<typeof import("mermaid")["default"]> | undefined;

function loadMermaid() {
  // Diagram rendering is needed only for full Markdown fields that actually
  // contain a Mermaid fence, so ordinary pages do not load the large library.
  mermaidLoader ??= import("mermaid").then(({ default: mermaid }) => {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      suppressErrorRendering: true,
      theme: "dark",
      // Dagre keeps common diagrams light to load; a diagram can still opt
      // into ELK through Mermaid frontmatter when its layout needs it.
      layout: "dagre",
    });
    return mermaid;
  });
  return mermaidLoader;
}

export function MermaidDiagram({ source }: { source: string }) {
  const [result, setResult] = useState<DiagramResult | null>(null);

  useEffect(() => {
    let active = true;
    const id = `markdown-mermaid-${++diagramNumber}`;

    void loadMermaid()
      .then((mermaid) => (active ? mermaid.render(id, source) : null))
      .then((rendered) => {
        if (!active || !rendered) return;
        const { svg } = rendered;
        // Mermaid turns accTitle/accDescr into SVG metadata. Reuse that output
        // for the wrapper's accessible name instead of parsing its syntax twice.
        const document = new DOMParser().parseFromString(svg, "image/svg+xml");
        const title = document.querySelector("svg > title")?.textContent?.trim();
        const description = document.querySelector("svg > desc")?.textContent?.trim();
        setResult({ source, status: "ready", svg, title, description });
      })
      .catch(() => {
        if (active) setResult({ source, status: "error" });
      });

    // A field can change while rendering; an old result must not replace the
    // diagram for the new Markdown text or update an unmounted component.
    return () => {
      active = false;
    };
  }, [source]);

  const currentResult = result?.source === source ? result : null;
  const sourceBlock = (
    <pre className="overflow-x-auto rounded-md bg-muted p-4">
      <code className="language-mermaid">{source}</code>
    </pre>
  );

  if (currentResult?.status !== "ready") {
    return (
      <div>
        {currentResult?.status === "error" ? (
          <p className="mb-2 text-muted-foreground">Diagram could not be rendered</p>
        ) : null}
        {sourceBlock}
      </div>
    );
  }

  return (
    <figure className="min-w-0 space-y-2">
      {/* The app currently uses a dark theme, so keep Mermaid's palette and
          the diagram surface aligned instead of relying on CSS inversion. */}
      <div className="overflow-x-auto rounded-md border bg-card p-4 text-card-foreground">
        <div
          aria-description={currentResult.description}
          aria-label={currentResult.title || "Mermaid diagram"}
          className="[&_svg]:h-auto [&_svg]:max-w-full"
          // Mermaid produces this SVG from the diagram source in strict mode.
          dangerouslySetInnerHTML={{ __html: currentResult.svg }}
          role="img"
        />
      </div>
      <details className="text-xs text-muted-foreground">
        <summary className="w-fit cursor-pointer hover:text-foreground">
          View diagram source
        </summary>
        <div className="mt-2">{sourceBlock}</div>
      </details>
    </figure>
  );
}

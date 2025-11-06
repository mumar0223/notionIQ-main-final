"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";
import rehypeKatex from "rehype-katex";
import "@/styles/markdown.css";
import "katex/dist/katex.min.css";

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={{
          h1: ({ children }) => (
            <h1 className="markdown-h1">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="markdown-h2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="markdown-h3">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="markdown-h4">{children}</h4>
          ),
          h5: ({ children }) => (
            <h5 className="markdown-h5">{children}</h5>
          ),
          h6: ({ children }) => (
            <h6 className="markdown-h6">{children}</h6>
          ),
          p: ({ children }) => (
            <p className="markdown-paragraph">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="markdown-list-unordered">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="markdown-list-ordered">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="markdown-list-item">{children}</li>
          ),
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            return match ? (
              <code className="markdown-code-block" {...props}>
                {children}
              </code>
            ) : (
              <code className="markdown-code-inline" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="markdown-pre">{children}</pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="markdown-blockquote">{children}</blockquote>
          ),
          table: ({ children }) => (
            <table className="markdown-table">{children}</table>
          ),
          thead: ({ children }) => (
            <thead className="markdown-thead">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="markdown-tbody">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="markdown-tr">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="markdown-th">{children}</th>
          ),
          td: ({ children }) => (
            <td className="markdown-td">{children}</td>
          ),
          a: ({ href, children }) => (
            <a href={href} className="markdown-link" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          hr: () => <hr className="markdown-hr" />,
          img: ({ src, alt }) => (
            <img src={src} alt={alt} className="markdown-img" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

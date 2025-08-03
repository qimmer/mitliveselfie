/// <reference types="@solidjs/start/env" />

declare module "*.md" {
  const value: () => JSX.Element;
  export default value;
}

declare module "*.mdx" {
  const value: () => JSX.Element;
  export default value;
}

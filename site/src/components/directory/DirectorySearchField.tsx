import { Input } from '@evefrontier/component-library';
import type { ChangeEvent } from 'react';

type DirectorySearchFieldProps = {
  value: string;
  onChange: (search: string) => void;
};

export function DirectorySearchField({
  value,
  onChange,
}: DirectorySearchFieldProps) {
  return (
    <section aria-label="Search catalog" className="directory-toolbar-search">
      <Input
        autoComplete="off"
        fullWidth
        id="dapp-index-search"
        label="Search"
        name="dapp-index-search"
        placeholder="Name, summary, category, URL, package id…"
        size="md"
        type="search"
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(event.target.value)
        }
      />
    </section>
  );
}

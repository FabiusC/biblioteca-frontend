import { useEffect, useRef, useState } from "react";

// Forma de un documento devuelto por la busqueda de Open Library
export interface OpenLibraryDoc {
  title: string;
  author_name?: string[];
  isbn?: string[];
}

interface BookSearchInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (doc: OpenLibraryDoc) => void;
}

const OPEN_LIBRARY_URL = "https://openlibrary.org/search.json";
const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 400;
const MAX_SUGGESTIONS = 8;

// Campo de titulo con autocompletado contra la API de Open Library.
// Aisla toda la logica de sugerencias (debounce, teclado, fetch) del formulario.
export function BookSearchInput({
  id,
  value,
  onChange,
  onSelect,
}: BookSearchInputProps) {
  const [suggestions, setSuggestions] = useState<OpenLibraryDoc[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<number | undefined>(undefined);

  // Cancela el debounce pendiente al desmontar el componente
  useEffect(() => {
    return () => window.clearTimeout(debounceRef.current);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    onChange(query);
    setShowSuggestions(false);
    setActiveIndex(-1);

    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      return;
    }

    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `${OPEN_LIBRARY_URL}?title=${encodeURIComponent(trimmed)}&fields=title,author_name,isbn`,
        );
        if (!response.ok) throw new Error("open library request failed");
        const data = (await response.json()) as { docs?: OpenLibraryDoc[] };
        setSuggestions(data.docs?.slice(0, MAX_SUGGESTIONS) ?? []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, DEBOUNCE_MS);
  };

  const selectSuggestion = (doc: OpenLibraryDoc) => {
    onSelect(doc);
    setShowSuggestions(false);
    setActiveIndex(-1);
  };

  // Navegacion por teclado dentro del listado de sugerencias
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div className="autocomplete">
      <input
        id={id}
        name="title"
        className="input-control"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={() => window.setTimeout(() => setShowSuggestions(false), 150)}
        placeholder="Título del libro"
        autoFocus
        required
        autoComplete="off"
        role="combobox"
        aria-expanded={showSuggestions}
        aria-controls={`${id}-suggestions`}
        aria-autocomplete="list"
      />
      {showSuggestions && (
        <ul
          id={`${id}-suggestions`}
          className="suggestions"
          role="listbox"
          aria-label="Sugerencias de titulos"
        >
          {suggestions.length === 0 ? (
            <li className="suggestions-empty">Sin coincidencias</li>
          ) : (
            suggestions.map((doc, index) => (
              <li
                key={`${doc.title}-${index}`}
                id={`${id}-suggestion-${index}`}
                className="suggestions-item"
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectSuggestion(doc)}
              >
                <span className="suggestions-title">{doc.title}</span>
                {doc.author_name?.[0] && (
                  <span className="suggestions-author">
                    {doc.author_name[0]}
                  </span>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export default BookSearchInput;


import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Search, MapPin, Users, Loader2 } from "lucide-react";
import { Institution } from "@/data/mockData";

interface InstitutionSearchProps {
  value: Institution | null;
  onChange: (institution: Institution | null) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  excludeIds?: string[];
}

const InstitutionSearch = ({ 
  value, 
  onChange, 
  placeholder = "Search institutions...", 
  label,
  disabled = false,
  excludeIds = []
}: InstitutionSearchProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Convert backend response to Institution format
  const convertToInstitution = (school: any, index: number): Institution => {
    const getEnrollmentSize = (size: number | null) => {
      if (!size) return 'Unknown';
      if (size < 5000) return 'Small (<5,000)';
      if (size < 10000) return 'Medium-Small (5,000-10,000)';
      if (size < 30000) return 'Medium (10,000-30,000)';
      return 'Large (30,000+)';
    };

    return {
      id: `search-${index}`,
      name: school.name || 'Unknown Institution',
      state: school.state || 'Unknown',
      type: school.ownership || 'Unknown',
      enrollmentSize: getEnrollmentSize(school.size)
    };
  };

  // Search function
  const searchInstitutions = async (query: string) => {
    if (!query.trim()) {
      setInstitutions([]);
      return;
    }

    setIsLoading(true);
    setSearchError(null);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to search institutions');
      }

      const data = await response.json();
      const convertedInstitutions = data.schools.map(convertToInstitution);
      setInstitutions(convertedInstitutions);
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Failed to search institutions. Please try again.');
      setInstitutions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery && isOpen) {
        searchInstitutions(searchQuery);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, isOpen]);

  const filteredInstitutions = institutions.filter(institution => 
    !excludeIds.includes(institution.id)
  );

  const handleSelect = (institution: Institution) => {
    onChange(institution);
    setSearchQuery("");
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setSearchQuery("");
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    setIsOpen(true);
    
    // Clear results if query is empty
    if (!newQuery.trim()) {
      setInstitutions([]);
      setSearchError(null);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      {label && (
        <label className="text-sm font-medium text-foreground mb-2 block">
          {label}
        </label>
      )}
      
      <div className="relative">
        {value ? (
          <div className="w-full p-3 border rounded-lg bg-card flex items-center justify-between">
            <div className="flex-1">
              <div className="font-medium text-foreground">{value.name}</div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <MapPin className="w-3 h-3" />
                <span>{value.state}</span>
                <span>•</span>
                <Users className="w-3 h-3" />
                <span>{value.type}</span>
                <span>•</span>
                <span>{value.enrollmentSize}</span>
              </div>
            </div>
            {!disabled && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="ml-2 h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              placeholder={placeholder}
              disabled={disabled}
              className="pl-10"
            />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && !value && !disabled && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
              Searching institutions...
            </div>
          ) : searchError ? (
            <div className="p-4 text-center text-destructive">
              <div className="text-sm">{searchError}</div>
            </div>
          ) : filteredInstitutions.length > 0 ? (
            <div className="p-1">
              {filteredInstitutions.map((institution) => (
                <button
                  key={institution.id}
                  onClick={() => handleSelect(institution)}
                  className="w-full text-left p-3 hover:bg-muted rounded-md transition-colors"
                >
                  <div className="font-medium text-foreground">{institution.name}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <MapPin className="w-3 h-3" />
                    <span>{institution.state}</span>
                    <span>•</span>
                    <Badge variant="outline" className="text-xs">
                      {institution.type}
                    </Badge>
                    <span>•</span>
                    <span>{institution.enrollmentSize}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="p-4 text-center text-muted-foreground">
              <div className="text-sm">No institutions found matching "{searchQuery}"</div>
              <div className="text-xs mt-1">Try a different search term</div>
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              <div className="text-sm">Start typing to search institutions...</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InstitutionSearch;

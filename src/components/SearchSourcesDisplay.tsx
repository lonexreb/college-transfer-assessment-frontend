
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Globe, CheckCircle, Search } from "lucide-react";

interface SearchTransferData {
  search_content: string;
  sources: string[];
  relevant_sources: string[];
  targeted_data: string;
}

interface SchoolData {
  name: string;
  search_transfer_data?: SearchTransferData;
  search_sources?: string[];
}

interface SearchSourcesDisplayProps {
  schoolsData: SchoolData[];
}

const SearchSourcesDisplay: React.FC<SearchSourcesDisplayProps> = ({ schoolsData }) => {
  const getDomainFromUrl = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  // Filter schools that have search data
  const schoolsWithSources = schoolsData.filter(school => {
    const searchData = school.search_transfer_data;
    const allSources = searchData?.sources || school.search_sources || [];
    return allSources.length > 0;
  });

  if (schoolsWithSources.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Searched Sources & Links
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          URLs searched by AI to gather transfer information for each school
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {schoolsWithSources.map((school, schoolIndex) => {
            const searchData = school.search_transfer_data;
            const allSources = searchData?.sources || school.search_sources || [];
            const relevantSources = searchData?.relevant_sources || [];

            return (
              <div key={schoolIndex} className="border-l-4 border-primary/20 pl-4">
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  {school.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {allSources.length} sources searched for transfer information
                  {relevantSources.length > 0 && (
                    <span className="text-green-600 ml-2">
                      ({relevantSources.length} with relevant content)
                    </span>
                  )}
                </p>
                
                {/* Search Summary */}
                {searchData?.targeted_data && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-medium text-sm text-blue-800 dark:text-blue-200 mb-1">
                      Search Summary:
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {searchData.targeted_data}
                    </p>
                  </div>
                )}

                {/* Sources List */}
                <div className="grid gap-2">
                  {allSources.map((source, sourceIndex) => {
                    const isRelevant = relevantSources.includes(source);
                    
                    return (
                      <div 
                        key={sourceIndex} 
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          isRelevant 
                            ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                            : 'bg-muted/30 border-border'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          isRelevant ? 'bg-green-500' : 'bg-blue-500'
                        }`}></div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-muted-foreground font-medium">
                              {getDomainFromUrl(source)}
                            </span>
                            {isRelevant && (
                              <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-300">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Relevant Content
                              </Badge>
                            )}
                          </div>
                          <a 
                            href={source} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline block truncate group"
                            title={source}
                          >
                            {source}
                            <ExternalLink className="w-3 h-3 ml-1 inline opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Transfer Content Preview */}
                {searchData?.search_content && (
                  <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-950/20 rounded-lg border">
                    <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 mb-2">
                      Transfer Information Found:
                    </h4>
                    <div className="text-sm text-slate-700 dark:text-slate-300 max-h-32 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-xs">
                        {searchData.search_content.substring(0, 500)}
                        {searchData.search_content.length > 500 && '...'}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchSourcesDisplay;

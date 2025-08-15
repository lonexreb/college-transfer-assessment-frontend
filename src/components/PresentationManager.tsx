import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import {
  FileText,
  Plus,
  Trash2,
  Eye,
  RefreshCw,
  Loader2,
  Share2,
  Calendar,
  Layers,
} from "lucide-react";

interface Presentation {
  id: string;
  firebase_id?: string;
  prompt: string;
  n_slides: number;
  language: string;
  theme: string;
  export_as: string;
  created_at: string;
  api_response?: any;
  static_url?: string;
}

const PresentationManager = () => {
  const { currentUser } = useAuth();
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [selectedPresentation, setSelectedPresentation] =
    useState<Presentation | null>(null);
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({});

  // Form state for creating new presentation
  const [formData, setFormData] = useState({
    prompt: "",
    n_slides: 5,
    language: "English",
    theme: "light",
    export_as: "pptx",
  });

  const API_BASE = "https://degree-works-backend-hydrabeans.replit.app";

  const fetchPresentations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/ppt/list/presentations`);

      if (!response.ok) {
        throw new Error("Failed to fetch presentations");
      }

      const data = await response.json();
      setPresentations(data.presentations || []);
    } catch (error) {
      console.error("Error fetching presentations:", error);
      setMessage({ type: "error", text: "Failed to fetch presentations" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresentations();
  }, []);

  const handleGeneratePresentation = async () => {
    if (!formData.prompt.trim()) {
      setMessage({ type: "error", text: "Please enter a prompt" });
      return;
    }

    setGenerating(true);
    setMessage(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("prompt", formData.prompt.trim());
      formDataToSend.append("n_slides", formData.n_slides.toString());
      formDataToSend.append("language", formData.language);
      formDataToSend.append("theme", formData.theme);
      formDataToSend.append("export_as", formData.export_as);

      const response = await fetch(
        `${API_BASE}/api/v1/ppt/generate/presentation`,
        {
          method: "POST",
          body: formDataToSend,
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to generate presentation");
      }

      const result = await response.json();
      setMessage({
        type: "success",
        text: "Presentation generated successfully!",
      });

      // Reset form
      setFormData({
        prompt: "",
        n_slides: 5,
        language: "English",
        theme: "light",
        export_as: "pptx",
      });

      // Refresh the list
      await fetchPresentations();
    } catch (error) {
      console.error("Error generating presentation:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to generate presentation",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleViewPresentation = async (presentationId: string) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/v1/ppt/presentation/${presentationId}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch presentation details");
      }

      const presentation = await response.json();
      setSelectedPresentation(presentation);
    } catch (error) {
      console.error("Error fetching presentation:", error);
      setMessage({
        type: "error",
        text: "Failed to load presentation details",
      });
    }
  };

  const handleDeletePresentation = async (presentationId: string) => {
    if (!confirm("Are you sure you want to delete this presentation?")) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/v1/ppt/presentation/${presentationId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to delete presentation");
      }

      setMessage({
        type: "success",
        text: "Presentation deleted successfully",
      });
      await fetchPresentations();

      // Close details if viewing deleted presentation
      if (
        selectedPresentation?.id === presentationId ||
        selectedPresentation?.firebase_id === presentationId
      ) {
        setSelectedPresentation(null);
      }
    } catch (error) {
      console.error("Error deleting presentation:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to delete presentation",
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return "Invalid date";
    }
  };

  return (
    <div className="space-y-6">
      {/* Generate New Presentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Generate New Presentation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert
              variant={message.type === "error" ? "destructive" : "default"}
            >
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="prompt">Presentation Topic/Prompt</Label>
              <Textarea
                id="prompt"
                value={formData.prompt}
                onChange={(e) =>
                  setFormData({ ...formData, prompt: e.target.value })
                }
                placeholder="Enter the topic or detailed prompt for your presentation..."
                disabled={generating}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="n_slides">Number of Slides</Label>
              <Input
                id="n_slides"
                type="number"
                min="1"
                max="20"
                value={formData.n_slides}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    n_slides: parseInt(e.target.value) || 5,
                  })
                }
                disabled={generating}
              />
            </div>

            <div>
              <Label htmlFor="language">Language</Label>
              <Select
                value={formData.language}
                onValueChange={(value) =>
                  setFormData({ ...formData, language: value })
                }
                disabled={generating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Spanish">Spanish</SelectItem>
                  <SelectItem value="French">French</SelectItem>
                  <SelectItem value="German">German</SelectItem>
                  <SelectItem value="Chinese">Chinese</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="theme">Theme</Label>
              <Select
                value={formData.theme}
                onValueChange={(value) =>
                  setFormData({ ...formData, theme: value })
                }
                disabled={generating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="colorful">Colorful</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="export_as">Export Format</Label>
              <Select
                value={formData.export_as}
                onValueChange={(value) =>
                  setFormData({ ...formData, export_as: value })
                }
                disabled={generating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pptx">PowerPoint (.pptx)</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleGeneratePresentation}
            disabled={generating || !formData.prompt.trim()}
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Presentation...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Generate Presentation
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Presentations List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Generated Presentations
            </div>
            <Button
              onClick={fetchPresentations}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading presentations...
            </div>
          ) : presentations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No presentations found</p>
              <p className="text-sm">
                Generate your first presentation to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {presentations.map((presentation) => (
                <div
                  key={presentation.firebase_id || presentation.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium truncate pr-4">
                      {presentation.prompt ? presentation.prompt.substring(0, 80) : "No prompt available"}
                      {presentation.prompt && presentation.prompt.length > 80 && "..."}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                      <div className="flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        <span>{presentation.n_slides} slides</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(presentation.created_at)}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {presentation.language}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {presentation.theme}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {presentation.export_as}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {presentation.static_url && (
                      <div className="flex gap-1">
                        <Button
                          onClick={() => window.open(`${API_BASE}${presentation.static_url}`, '_blank')}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View PDF
                        </Button>
                        <Button
                          onClick={() => {
                            const presentationId = presentation.firebase_id || presentation.id;
                            const shareableUrl = `${API_BASE}${presentation.static_url}`;
                            navigator.clipboard.writeText(shareableUrl);
                            setCopiedStates(prev => ({ ...prev, [presentationId]: true }));
                            setMessage({ type: "success", text: "Shareable link copied to clipboard!" });

                            // Reset copied state after 2 seconds
                            setTimeout(() => {
                              setCopiedStates(prev => ({ ...prev, [presentationId]: false }));
                            }, 2000);
                          }}
                          variant="default"
                          size="sm"
                        >
                          <Share2 className="w-4 h-4 mr-1" />
                          {copiedStates[presentation.firebase_id || presentation.id] ? "Copied!" : "Copy Shareable Link"}
                        </Button>
                      </div>
                    )}
                    <Button
                      onClick={() =>
                        handleViewPresentation(
                          presentation.firebase_id || presentation.id,
                        )
                      }
                      variant="outline"
                      size="sm"
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Details
                    </Button>
                    <Button
                      onClick={() =>
                        handleDeletePresentation(
                          presentation.firebase_id || presentation.id,
                        )
                      }
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Presentation Details Modal/View */}
      {selectedPresentation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Presentation Details</span>
              <Button
                onClick={() => setSelectedPresentation(null)}
                variant="outline"
                size="sm"
              >
                Close
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Prompt</Label>
              <div className="p-3 bg-muted rounded-lg">
                {selectedPresentation.prompt}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label>Slides</Label>
                <div className="p-2 bg-muted rounded text-center">
                  {selectedPresentation.n_slides}
                </div>
              </div>
              <div>
                <Label>Language</Label>
                <div className="p-2 bg-muted rounded text-center">
                  {selectedPresentation.language}
                </div>
              </div>
              <div>
                <Label>Theme</Label>
                <div className="p-2 bg-muted rounded text-center">
                  {selectedPresentation.theme}
                </div>
              </div>
              <div>
                <Label>Format</Label>
                <div className="p-2 bg-muted rounded text-center">
                  {selectedPresentation.export_as}
                </div>
              </div>
            </div>

            <div>
              <Label>Created</Label>
              <div className="p-2 bg-muted rounded">
                {formatDate(selectedPresentation.created_at)}
              </div>
            </div>

            {selectedPresentation.api_response && (
              <div>
                <Label>API Response</Label>
                <div className="p-3 bg-muted rounded-lg max-h-60 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(selectedPresentation.api_response, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PresentationManager;
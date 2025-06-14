
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SeoResult = {
  label: string;
  value: string | React.ReactNode;
  ok: boolean;
};

function extractHostname(url: string) {
  try {
    if (!/^https?:\/\//i.test(url)) {
      url = "http://" + url;
    }
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

export default function SeoCheckup() {
  const [url, setUrl] = useState("");
  const [results, setResults] = useState<SeoResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setResults(null);

    if (!url.trim()) {
      toast({ title: "Error", description: "Please enter a website URL", variant: "destructive" });
      return;
    }

    let inputUrl = url.trim();
    // Ensure it starts with protocol for fetch
    if (!/^https?:\/\//i.test(inputUrl)) {
      inputUrl = "https://" + inputUrl;
    }

    setLoading(true);

    try {
      // Try to fetch the site
      const res = await fetch(inputUrl, { method: "GET", mode: "cors" });
      const text = await res.text();

      // HTTPS usage
      const usesHttps = inputUrl.startsWith("https://");
      // robots.txt
      let robotsOk = false;
      try {
        const robotsUrl = inputUrl.replace(/\/+$/, "") + "/robots.txt";
        const robotsRes = await fetch(robotsUrl, { method: "HEAD", mode: "no-cors" });
        robotsOk = robotsRes.ok || robotsRes.type === "opaque"; // opaque is possible with no-cors, so we don't know for sure
      } catch { robotsOk = false; }

      // Title tag present
      const titleMatch = text.match(/<title>(.*?)<\/title>/i);
      // Meta description tag present
      const descMatch = text.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);

      setResults([
        { label: "HTTPS Usage", value: usesHttps ? "Yes" : "No", ok: usesHttps },
        { label: "robots.txt Found", value: robotsOk ? "Yes" : "Maybe (couldn't verify)", ok: robotsOk },
        { label: "Title Tag Present", value: titleMatch ? "Yes" : "No", ok: !!titleMatch },
        { label: "Meta Description Present", value: descMatch ? "Yes" : "No", ok: !!descMatch },
        {
          label: "Page Title",
          value: titleMatch ? (
            <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{titleMatch[1]}</span>
          ) : (
            <span className="italic text-slate-500">missing</span>
          ),
          ok: !!titleMatch,
        },
        {
          label: "Meta Description",
          value: descMatch ? (
            <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{descMatch[1]}</span>
          ) : (
            <span className="italic text-slate-500">missing</span>
          ),
          ok: !!descMatch,
        },
      ]);
      toast({ title: "✅ Checkup Complete", description: "See SEO details below 👇" });
    } catch (error) {
      toast({
        title: "❌ Could not fetch site",
        description:
          "Unable to check the URL. The site might block bots, or CORS is preventing checkup. Try another site!",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex flex-col items-center px-4 py-8">
      <div className="max-w-2xl w-full mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-2xl">🚀</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            SEO Site Checkup
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            Analyze your website's SEO fundamentals and get instant insights to improve your search rankings.
          </p>
        </div>

        {/* Form Card */}
        <Card className="mb-8 shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-slate-700 dark:text-slate-200">Website Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCheck} className="space-y-4">
              <div>
                <Label htmlFor="url" className="text-slate-700 dark:text-slate-300 font-medium">Website URL</Label>
                <Input
                  id="url"
                  placeholder="e.g. example.com or https://mysite.org"
                  value={url}
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                  onChange={e => setUrl(e.target.value)}
                  disabled={loading}
                  className="mt-2 border-slate-200 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-2.5 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Analyzing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>🔍</span>
                    Run SEO Analysis
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results Section */}
        {results && (
          <Card className="animate-fade-in shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <span>📊</span>
                SEO Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-600">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600">
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-200">Check</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-200">Result</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-200">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((row, index) => (
                      <TableRow 
                        key={row.label} 
                        className={`${
                          row.ok 
                            ? "bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-l-4 border-l-emerald-500" 
                            : "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-l-4 border-l-red-500"
                        } hover:opacity-80 transition-opacity`}
                      >
                        <TableCell className="font-medium text-slate-700 dark:text-slate-200">{row.label}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-300">{row.value}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                            row.ok 
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200" 
                              : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200"
                          }`}>
                            {row.ok ? "✅ Pass" : "⚠️ Warn"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <span>ℹ️</span>
                  Results are only as accurate as what's publicly available via browser fetch (CORS may limit checks).
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

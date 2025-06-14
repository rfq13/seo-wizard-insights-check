
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

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
        { label: "robots.txt Found", value: robotsOk ? "Yes" : "Maybe (couldn’t verify)", ok: robotsOk },
        { label: "Title Tag Present", value: titleMatch ? "Yes" : "No", ok: !!titleMatch },
        { label: "Meta Description Present", value: descMatch ? "Yes" : "No", ok: !!descMatch },
        {
          label: "Page Title",
          value: titleMatch ? (
            <span className="font-mono text-xs text-muted-foreground">{titleMatch[1]}</span>
          ) : (
            <span className="italic text-muted-foreground">missing</span>
          ),
          ok: !!titleMatch,
        },
        {
          label: "Meta Description",
          value: descMatch ? (
            <span className="font-mono text-xs text-muted-foreground">{descMatch[1]}</span>
          ) : (
            <span className="italic text-muted-foreground">missing</span>
          ),
          ok: !!descMatch,
        },
      ]);
      toast({ title: "Checkup Complete", description: "See SEO details below 👇" });
    } catch (error) {
      toast({
        title: "Could not fetch site",
        description:
          "Unable to check the URL. The site might block bots, or CORS is preventing checkup. Try another site!",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-8 animate-fade-in">
      <div className="max-w-xl w-full mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-2 text-center">SEO Site Checkup</h2>
        <p className="mb-6 text-center text-muted-foreground">Enter any public website to check basic SEO tags and settings.</p>
        <form onSubmit={handleCheck} className="flex flex-col gap-4">
          <Label htmlFor="url">Website URL</Label>
          <Input
            id="url"
            placeholder="e.g. example.com or https://mysite.org"
            value={url}
            autoFocus
            autoComplete="off"
            spellCheck={false}
            onChange={e => setUrl(e.target.value)}
            disabled={loading}
          />
          <Button type="submit" disabled={loading}>{loading ? "Checking..." : "Run Checkup"}</Button>
        </form>

        {results && (
          <div className="mt-8 animate-fade-in">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Check</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map(row => (
                  <TableRow key={row.label} className={row.ok ? "bg-green-50 dark:bg-green-900/10" : "bg-red-50 dark:bg-red-900/20"}>
                    <TableCell>{row.label}</TableCell>
                    <TableCell>{row.value}</TableCell>
                    <TableCell>
                      <span className={row.ok ? "text-green-700 dark:text-green-400 font-bold" : "text-red-700 dark:text-red-400 font-bold"}>
                        {row.ok ? "✓ Pass" : "✗ Warn"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="text-xs text-muted-foreground mt-2">
              Results are only as accurate as what’s publicly available via browser fetch (CORS may limit checks).
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

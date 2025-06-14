import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CheckCircle, AlertTriangle } from "lucide-react";

type SeoResult = {
  label: string;
  value: string | React.ReactNode;
  ok: boolean;
  category?: string;
};

type SeoScore = {
  score: number;
  total: number;
  percentage: number;
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

function analyzeHeadingStructure(html: string) {
  const headings = html.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi) || [];
  const headingCounts = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
  
  headings.forEach(heading => {
    const level = heading.match(/<h([1-6])/)?.[1];
    if (level) headingCounts[`h${level}` as keyof typeof headingCounts]++;
  });
  
  return { headings, counts: headingCounts };
}

function analyzeImages(html: string) {
  const images = html.match(/<img[^>]*>/gi) || [];
  const imagesWithoutAlt = images.filter(img => !img.includes('alt=') || img.includes('alt=""') || img.includes("alt=''"));
  return { total: images.length, withoutAlt: imagesWithoutAlt.length };
}

function analyzeSocialTags(html: string) {
  const ogTags = (html.match(/<meta[^>]*property=["']og:[^"']*["'][^>]*>/gi) || []).length;
  const twitterTags = (html.match(/<meta[^>]*name=["']twitter:[^"']*["'][^>]*>/gi) || []).length;
  return { openGraph: ogTags, twitter: twitterTags };
}

function analyzeLinks(html: string) {
  const allLinks = html.match(/<a[^>]*href=["'][^"']*["'][^>]*>/gi) || [];
  const externalLinks = allLinks.filter(link => 
    link.includes('http') && !link.includes(window.location.hostname)
  );
  const internalLinks = allLinks.filter(link => 
    !link.includes('http') || link.includes(window.location.hostname)
  );
  return { total: allLinks.length, external: externalLinks.length, internal: internalLinks.length };
}

const getDummyData = (hostname: string): { results: SeoResult[], score: SeoScore, loadTime: number } => {
  const dummyResults: SeoResult[] = [
    // Basic SEO
    { label: "HTTPS Usage", value: "Ya", ok: true, category: "Basic" },
    { label: "robots.txt Found", value: "Ya", ok: true, category: "Basic" },
    { label: "Page Load Time", value: "1.2s (Sangat Baik)", ok: true, category: "Performance" },

    // Meta Tags
    { label: "Title Tag Present", value: "Ya", ok: true, category: "Meta Tags" },
    { label: "Meta Description Present", value: "Ya", ok: true, category: "Meta Tags" },
    { label: "Meta Keywords", value: "Ya", ok: true, category: "Meta Tags" },
    { label: "Viewport Meta Tag", value: "Ya", ok: true, category: "Meta Tags" },
    { label: "Canonical URL", value: "Ya", ok: true, category: "Meta Tags" },

    // Content Structure
    { label: "H1 Tags", value: "1 tag (Ideal)", ok: true, category: "Content" },
    { label: "Heading Structure", value: "H1:1 H2:4 H3:8", ok: true, category: "Content" },
    
    // Images
    { label: "Images Alt Text", value: "12/12 memiliki alt text", ok: true, category: "Images" },

    // Social Media
    { label: "Open Graph Tags", value: "8 tags", ok: true, category: "Social" },
    { label: "Twitter Cards", value: "5 tags", ok: true, category: "Social" },

    // Technical SEO
    { label: "Schema Markup", value: "Ya", ok: true, category: "Technical" },
    { label: "Internal Links", value: "23 links", ok: true, category: "Links" },
    { label: "External Links", value: "7 links", ok: true, category: "Links" },

    // Content Details
    {
      label: "Page Title",
      value: (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
          {hostname} - Platform SEO Terbaik untuk Analisis Website Professional
        </span>
      ),
      ok: true,
      category: "Details"
    },
    {
      label: "Meta Description",
      value: (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
          Analisis SEO lengkap untuk website Anda. Periksa meta tags, struktur heading, optimasi gambar, dan 15+ faktor SEO penting lainnya untuk meningkatkan ranking di Google.
        </span>
      ),
      ok: true,
      category: "Details"
    },
  ];

  const score = { score: 16, total: 16, percentage: 100 };
  const loadTime = 1200;

  return { results: dummyResults, score, loadTime };
};

export default function SeoCheckup() {
  const [url, setUrl] = useState("");
  const [results, setResults] = useState<SeoResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [seoScore, setSeoScore] = useState<SeoScore | null>(null);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handlePreview = () => {
    const hostname = url ? extractHostname(url) || "example.com" : "example.com";
    const dummyData = getDummyData(hostname);
    
    setResults(dummyData.results);
    setSeoScore(dummyData.score);
    setLoadTime(dummyData.loadTime);
    setShowPreview(true);
    
    toast({ 
      title: "✨ Preview Data Ditampilkan", 
      description: "Ini adalah contoh hasil analisis SEO dengan data dummy untuk demonstrasi" 
    });
  };

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setResults(null);
    setSeoScore(null);
    setLoadTime(null);
    setShowPreview(false);

    if (!url.trim()) {
      toast({ title: "Error", description: "Silakan masukkan URL website", variant: "destructive" });
      return;
    }

    let inputUrl = url.trim();
    if (!/^https?:\/\//i.test(inputUrl)) {
      inputUrl = "https://" + inputUrl;
    }

    setLoading(true);
    const startTime = performance.now();

    try {
      const res = await fetch(inputUrl, { method: "GET", mode: "cors" });
      const endTime = performance.now();
      const pageLoadTime = Math.round(endTime - startTime);
      setLoadTime(pageLoadTime);
      
      const text = await res.text();

      // Basic checks
      const usesHttps = inputUrl.startsWith("https://");
      let robotsOk = false;
      try {
        const robotsUrl = inputUrl.replace(/\/+$/, "") + "/robots.txt";
        const robotsRes = await fetch(robotsUrl, { method: "HEAD", mode: "no-cors" });
        robotsOk = robotsRes.ok || robotsRes.type === "opaque";
      } catch { robotsOk = false; }

      // Meta tags analysis
      const titleMatch = text.match(/<title>(.*?)<\/title>/i);
      const descMatch = text.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
      const keywordsMatch = text.match(/<meta\s+name=["']keywords["']\s+content=["'](.*?)["']/i);
      const viewportMatch = text.match(/<meta\s+name=["']viewport["']/i);
      const canonicalMatch = text.match(/<link[^>]*rel=["']canonical["'][^>]*>/i);

      // Advanced analysis
      const headingAnalysis = analyzeHeadingStructure(text);
      const imageAnalysis = analyzeImages(text);
      const socialAnalysis = analyzeSocialTags(text);
      const linkAnalysis = analyzeLinks(text);
      const hasSchemaMarkup = text.includes('application/ld+json') || text.includes('itemscope');

      const newResults: SeoResult[] = [
        // Basic SEO
        { label: "HTTPS Usage", value: usesHttps ? "Ya" : "Tidak", ok: usesHttps, category: "Basic" },
        { label: "robots.txt Found", value: robotsOk ? "Ya" : "Mungkin (tidak dapat diverifikasi)", ok: robotsOk, category: "Basic" },
        { 
          label: "Page Load Time", 
          value: `${pageLoadTime}ms ${pageLoadTime < 3000 ? '(Baik)' : pageLoadTime < 5000 ? '(Sedang)' : '(Lambat)'}`, 
          ok: pageLoadTime < 3000, 
          category: "Performance" 
        },

        // Meta Tags
        { label: "Title Tag Present", value: titleMatch ? "Ya" : "Tidak", ok: !!titleMatch, category: "Meta Tags" },
        { label: "Meta Description Present", value: descMatch ? "Ya" : "Tidak", ok: !!descMatch, category: "Meta Tags" },
        { label: "Meta Keywords", value: keywordsMatch ? "Ya" : "Tidak", ok: !!keywordsMatch, category: "Meta Tags" },
        { label: "Viewport Meta Tag", value: viewportMatch ? "Ya" : "Tidak", ok: !!viewportMatch, category: "Meta Tags" },
        { label: "Canonical URL", value: canonicalMatch ? "Ya" : "Tidak", ok: !!canonicalMatch, category: "Meta Tags" },

        // Content Structure
        { 
          label: "H1 Tags", 
          value: `${headingAnalysis.counts.h1} tag${headingAnalysis.counts.h1 === 1 ? ' (Ideal)' : headingAnalysis.counts.h1 === 0 ? ' (Tidak ada)' : ' (Terlalu banyak)'}`, 
          ok: headingAnalysis.counts.h1 === 1, 
          category: "Content" 
        },
        { 
          label: "Heading Structure", 
          value: `H1:${headingAnalysis.counts.h1} H2:${headingAnalysis.counts.h2} H3:${headingAnalysis.counts.h3}`, 
          ok: headingAnalysis.counts.h1 > 0 && headingAnalysis.counts.h2 > 0, 
          category: "Content" 
        },
        
        // Images
        { 
          label: "Images Alt Text", 
          value: imageAnalysis.total > 0 ? `${imageAnalysis.total - imageAnalysis.withoutAlt}/${imageAnalysis.total} memiliki alt text` : "Tidak ada gambar", 
          ok: imageAnalysis.total === 0 || imageAnalysis.withoutAlt === 0, 
          category: "Images" 
        },

        // Social Media
        { 
          label: "Open Graph Tags", 
          value: socialAnalysis.openGraph > 0 ? `${socialAnalysis.openGraph} tags` : "Tidak ada", 
          ok: socialAnalysis.openGraph > 0, 
          category: "Social" 
        },
        { 
          label: "Twitter Cards", 
          value: socialAnalysis.twitter > 0 ? `${socialAnalysis.twitter} tags` : "Tidak ada", 
          ok: socialAnalysis.twitter > 0, 
          category: "Social" 
        },

        // Technical SEO
        { label: "Schema Markup", value: hasSchemaMarkup ? "Ya" : "Tidak", ok: hasSchemaMarkup, category: "Technical" },
        { 
          label: "Internal Links", 
          value: `${linkAnalysis.internal} links`, 
          ok: linkAnalysis.internal > 0, 
          category: "Links" 
        },
        { 
          label: "External Links", 
          value: `${linkAnalysis.external} links`, 
          ok: true, 
          category: "Links" 
        },

        // Content Details
        {
          label: "Page Title",
          value: titleMatch ? (
            <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{titleMatch[1]}</span>
          ) : (
            <span className="italic text-slate-500">missing</span>
          ),
          ok: !!titleMatch,
          category: "Details"
        },
        {
          label: "Meta Description",
          value: descMatch ? (
            <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{descMatch[1]}</span>
          ) : (
            <span className="italic text-slate-500">missing</span>
          ),
          ok: !!descMatch,
          category: "Details"
        },
      ];

      // Calculate SEO Score
      const passedChecks = newResults.filter(result => result.ok && result.category !== "Details").length;
      const totalChecks = newResults.filter(result => result.category !== "Details").length;
      const percentage = Math.round((passedChecks / totalChecks) * 100);

      setResults(newResults);
      setSeoScore({ score: passedChecks, total: totalChecks, percentage });
      
      toast({ 
        title: "✅ Analisis Selesai", 
        description: `Skor SEO: ${percentage}% (${passedChecks}/${totalChecks})` 
      });
    } catch (error) {
      toast({
        title: "❌ Tidak dapat mengakses website",
        description: "Website mungkin memblokir bot, atau ada masalah CORS. Coba website lain!",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const groupedResults = results?.reduce((acc, result) => {
    if (!result.category || result.category === "Details") return acc;
    if (!acc[result.category]) acc[result.category] = [];
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, SeoResult[]>);

  const detailResults = results?.filter(result => result.category === "Details");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex flex-col items-center px-4 py-8">
      <ThemeToggle />
      <div className="max-w-4xl w-full mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-2xl">🚀</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            SEO Site Checkup Pro
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            Analisis lengkap SEO website Anda dengan lebih dari 15 kriteria penting untuk meningkatkan ranking di search engine.
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
              <div className="flex gap-3">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-2.5 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Menganalisis...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>🔍</span>
                      Jalankan Analisis SEO Lengkap
                    </div>
                  )}
                </Button>
                <Button 
                  type="button" 
                  onClick={handlePreview}
                  disabled={loading}
                  variant="outline"
                  className="px-6 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <span>✨</span>
                    Preview
                  </div>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Preview Notice */}
        {showPreview && (
          <Card className="mb-4 animate-fade-in shadow-lg border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-900/20 backdrop-blur-sm">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <span>💡</span>
                <span className="text-sm font-medium">
                  Ini adalah data preview untuk demonstrasi. Masukkan URL asli untuk analisis yang akurat.
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SEO Score Card */}
        {seoScore && (
          <Card className="mb-8 animate-fade-in shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <span>📊</span>
                Skor SEO Overall
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {seoScore.percentage}%
                </div>
                <div className="flex-1">
                  <Progress value={seoScore.percentage} className="h-3" />
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {seoScore.score} dari {seoScore.total} kriteria terpenuhi
                  </p>
                </div>
                <Badge 
                  variant={seoScore.percentage >= 80 ? "default" : seoScore.percentage >= 60 ? "secondary" : "destructive"}
                  className="text-sm px-3 py-1"
                >
                  {seoScore.percentage >= 80 ? "Excellent" : seoScore.percentage >= 60 ? "Good" : "Needs Work"}
                </Badge>
              </div>
              {loadTime && (
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  ⚡ Load Time: {loadTime}ms
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results Section - Grouped by Category */}
        {groupedResults && (
          <div className="space-y-6 animate-fade-in">
            {Object.entries(groupedResults).map(([category, categoryResults]) => (
              <Card key={category} className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <span>
                      {category === "Basic" && "🔒"}
                      {category === "Performance" && "⚡"}
                      {category === "Meta Tags" && "🏷️"}
                      {category === "Content" && "📝"}
                      {category === "Images" && "🖼️"}
                      {category === "Social" && "📱"}
                      {category === "Technical" && "⚙️"}
                      {category === "Links" && "🔗"}
                    </span>
                    {category === "Basic" && "Basic SEO"}
                    {category === "Performance" && "Performance"}
                    {category === "Meta Tags" && "Meta Tags"}
                    {category === "Content" && "Content Structure"}
                    {category === "Images" && "Images"}
                    {category === "Social" && "Social Media"}
                    {category === "Technical" && "Technical SEO"}
                    {category === "Links" && "Links"}
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
                        {categoryResults.map((row, index) => (
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
                              <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
                                row.ok 
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200" 
                                  : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200"
                              }`}>
                                {row.ok ? (
                                  <>
                                    <CheckCircle className="w-4 h-4" />
                                    Pass
                                  </>
                                ) : (
                                  <>
                                    <AlertTriangle className="w-4 h-4" />
                                    Warn
                                  </>
                                )}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Detail Results */}
            {detailResults && detailResults.length > 0 && (
              <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <span>📋</span>
                    Content Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-600">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600">
                          <TableHead className="font-semibold text-slate-700 dark:text-slate-200">Element</TableHead>
                          <TableHead className="font-semibold text-slate-700 dark:text-slate-200">Content</TableHead>
                          <TableHead className="font-semibold text-slate-700 dark:text-slate-200">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailResults.map((row, index) => (
                          <TableRow 
                            key={row.label} 
                            className={`${
                              row.ok 
                                ? "bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-l-4 border-l-emerald-500" 
                                : "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-l-4 border-l-red-500"
                            } hover:opacity-80 transition-opacity`}
                          >
                            <TableCell className="font-medium text-slate-700 dark:text-slate-200">{row.label}</TableCell>
                            <TableCell className="text-slate-600 dark:text-slate-300 max-w-md">{row.value}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
                                row.ok 
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200" 
                                  : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200"
                              }`}>
                                {row.ok ? (
                                  <>
                                    <CheckCircle className="w-4 h-4" />
                                    Pass
                                  </>
                                ) : (
                                  <>
                                    <AlertTriangle className="w-4 h-4" />
                                    Warn
                                  </>
                                )}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1 mb-2">
                <span>💡</span>
                <strong>Tips untuk meningkatkan SEO:</strong>
              </p>
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <li>• Pastikan setiap halaman memiliki title tag dan meta description yang unik</li>
                <li>• Gunakan struktur heading (H1, H2, H3) yang logis dan hierarkis</li>
                <li>• Tambahkan alt text pada semua gambar untuk aksesibilitas</li>
                <li>• Implementasikan Open Graph tags untuk sharing di social media</li>
                <li>• Optimalkan kecepatan loading halaman (target &lt; 3 detik)</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

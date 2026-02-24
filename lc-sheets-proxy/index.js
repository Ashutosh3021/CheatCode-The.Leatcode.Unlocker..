export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname !== "/sheets") {
      return new Response("Not Found", { status: 404 });
    }

    const spreadsheetId = url.searchParams.get("spreadsheetId");
    let range = url.searchParams.get("range") || "Sheet1";

    if (!spreadsheetId) {
      return new Response("Missing spreadsheetId", { status: 400 });
    }

    // Use public JSON feed format (no API key needed for public sheets)
    const apiUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(range)}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        return new Response(`Google Sheets error: ${response.status}`, { status: response.status });
      }
      const text = await response.text();
      
      // Parse the GViz response (remove the wrapper)
      const jsonMatch = text.match(/(\{.*\})/);
      if (!jsonMatch) {
        return new Response("Invalid response from Google Sheets", { status: 500 });
      }
      
      const data = JSON.parse(jsonMatch[1]);
      
      // Convert to simpler format
      const rows = data.table.rows.map(row => row.c.map(cell => cell ? cell.v : null));
      
      return new Response(JSON.stringify({ values: rows }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(`Proxy error: ${err.message}`, { status: 500 });
    }
  },
};

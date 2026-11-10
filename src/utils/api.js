export async function readApiJson(response, fallbackMessage) {
  let data;

  try {
    data = await response.json();
  } catch {
    const status = `HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ""}`;
    const apiHint =
      response.status === 502
        ? " Check that the API server is running on port 3001."
        : "";
    const error = new Error(
      `${fallbackMessage} The server returned an empty or invalid response (${status}).${apiHint}`,
    );
    console.error(fallbackMessage, error);
    throw error;
  }

  if (!response.ok) {
    const error = new Error(
      data.error || `${fallbackMessage} (HTTP ${response.status}).`,
    );
    console.error(fallbackMessage, error);
    throw error;
  }

  return data;
}

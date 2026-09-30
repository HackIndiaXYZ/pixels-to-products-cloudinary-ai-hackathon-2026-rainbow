async function uploadFile() {

  const input = document.getElementById("fileInput");
  const result = document.getElementById("result");
  const loading = document.getElementById("loading");

  if (!input.files.length) {
    alert("Please select an image");
    return;
  }

  const formData = new FormData();
  formData.append("file", input.files[0]);

  loading.innerText = "Analyzing media with Cloudinary...";

  try {

    const response = await fetch(
      "http://localhost:5000/api/upload",
      {
        method: "POST",
        body: formData
      }
    );

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error);
    }

    const a = data.asset;

    result.innerHTML = `
      <div class="card">

        <img class="preview" src="${a.url}">

        <h2>${a.name}</h2>

        <p><b>Format:</b> ${a.format}</p>

        <p><b>Resolution:</b>
        ${a.width} × ${a.height}</p>

        <p><b>File Size:</b>
        ${(a.size / 1024 / 1024).toFixed(2)} MB</p>

        <p><b>Focus Quality:</b>
        ${a.focus !== null ? a.focus.toFixed(2) : "N/A"}</p>

        <h2>Waste Score: ${a.wasteScore}/100</h2>

        <h3>Recommendation:
        ${a.recommendation}</h3>

      </div>
    `;

  } catch (error) {

    result.innerHTML =
      <p>Error: ${error.message}</p>;

  }

  loading.innerText = "";
}

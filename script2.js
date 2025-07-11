document.getElementById('searchBtn').addEventListener('click', () => {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  const resultsDiv = document.getElementById('results');

  if (query === '') {
    resultsDiv.innerHTML = `<p>Please enter a medicine name! 💊</p>`;
    return;
  }

  fetch('medicines.json')
    .then(response => response.json())
    .then(data => {
      const med = data.find(m => m.name.toLowerCase() === query);

      if (!med) {
        resultsDiv.innerHTML = `<p>No data found for "${query}". 🫥</p>`;
        return;
      }

      resultsDiv.innerHTML = `
        <h2>${med.name}</h2>
        <p><strong>Uses:</strong> ${med.uses}</p>
        <p><strong>Dosage:</strong> ${med.dosage}</p>
        <p><strong>Side Effects:</strong> ${med.sideEffects}</p>
        <p><strong>Precautions:</strong> ${med.precautions}</p>
        <p><strong>Description:</strong> ${med.description}</p>
        <p><strong>Mechanism:</strong> ${med.mechanism}</p>
      `;
    })
    .catch(error => {
      console.error(error);
      resultsDiv.innerHTML = `<p>Oops! Could not fetch medicine data. 🧯</p>`;
    });
});

// Camera search logic
const cameraBtn = document.getElementById('cameraBtn');
const imageInput = document.getElementById('imageInput');
const resultsDiv = document.getElementById('results');

if (cameraBtn && imageInput) {
  cameraBtn.addEventListener('click', () => {
    imageInput.value = '';
    imageInput.click();
  });

  imageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    resultsDiv.innerHTML = '<p>Analyzing image... <span style="font-size:1.2em">🔎</span></p>';
    try {
      const reader = new FileReader();
      reader.onload = async function(event) {
        const base64 = event.target.result.split(',')[1];
        const response = await fetch('http://localhost:5000/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 })
        });
        if (!response.ok) throw new Error('Vision API error');
        const data = await response.json();
        // Display labels or fallback
        const labels = data.responses?.[0]?.labelAnnotations;
        if (labels && labels.length) {
          // Try to find a matching medicine by label
          fetch('medicines.json')
            .then(response => response.json())
            .then(meds => {
              let bestMatch = null;
              for (const label of labels) {
                bestMatch = meds.find(m => m.name.toLowerCase() === label.description.toLowerCase());
                if (bestMatch) break;
              }
              if (bestMatch) {
                resultsDiv.innerHTML = `
                  <h2>${bestMatch.name} <span style='font-size:1.2em'>💊</span></h2>
                  <p><strong>Uses:</strong> ${bestMatch.uses}</p>
                  <p><strong>Dosage:</strong> ${bestMatch.dosage}</p>
                  <p><strong>Side Effects:</strong> ${bestMatch.sideEffects}</p>
                  <p><strong>Precautions:</strong> ${bestMatch.precautions}</p>
                  <p><strong>Description:</strong> ${bestMatch.description}</p>
                  <p><strong>Mechanism:</strong> ${bestMatch.mechanism}</p>
                  <hr><p style='color:#aaa;font-size:.95em'>Matched by image label: <b>${bestMatch.name}</b></p>
                `;
              } else {
                resultsDiv.innerHTML = `<h2>Detected:</h2><ul>${labels.map(l => `<li>${l.description} (${(l.score*100).toFixed(1)}%)</li>`).join('')}</ul>`;
              }
            })
            .catch(() => {
              resultsDiv.innerHTML = `<h2>Detected:</h2><ul>${labels.map(l => `<li>${l.description} (${(l.score*100).toFixed(1)}%)</li>`).join('')}</ul>`;
            });
        } else {
          resultsDiv.innerHTML = '<p>No recognizable objects found.</p>';
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      resultsDiv.innerHTML = `<p>Image search failed. <span style='color:#e57373'>${err.message}</span></p>`;
    }
  });
}

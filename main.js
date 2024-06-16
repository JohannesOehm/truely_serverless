const $ = s => document.querySelector(s)

async function calculateBMI() {
  let weight = $("#gewicht").value;
  let height = $("#groesse").value;

  let response = await fetch(`/calculateBMI?height=${height}&weight=${weight}`);

  $("#bmi").innerText = await response.text();
}


navigator.serviceWorker.addEventListener("activate", (event) => console.log("sw is activated"));

const registerServiceWorker = async () => {
  if (navigator.serviceWorker) {
    $("#loading").showModal();
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      if (registration.installing) {
        console.log("Service worker installing");
      } else if (registration.waiting) {
        console.log("Service worker installed");
      } else if (registration.active) {
        console.log("Service worker active");
      }

      await navigator.serviceWorker.ready;
      console.log("service-worker is ready");
      $("#loading").close();

    } catch (error) {
      console.error(`Registration failed with ${error}`);
      $("#loading").innerText = "Service Worker Fail!";
    }
  } else {
    alert("ServiceWorker is not in navigator!");
  }
};


navigator.serviceWorker.onmessage = (event) => {
  console.log("got message from serviceworker", event);
}


registerServiceWorker().then(r => {});

const form = document.querySelector("[data-rsvp-form]");

if (form) {
  const endpoint = "https://script.google.com/macros/s/AKfycbzWx3lZB32C6YHdn5RWeEB3J1om33u7g-cZORQXqplpmVh2t2OTpx-MVtqTlEKdunoz/exec";
  const nameInput = form.querySelector('[name="guestName"]');
  const attendanceInputs = [...form.querySelectorAll('[name="attendance"]')];
  const nameError = form.querySelector("#rsvp-name-error");
  const attendanceError = form.querySelector("#rsvp-attendance-error");
  const status = form.querySelector("[data-rsvp-status]");
  const submitButton = form.querySelector('[type="submit"]');
  const submitLabel = submitButton.textContent;
  let submitting = false;
  let confirmedSubmission = "";

  const attendanceValues = { accepts: "Attending", declines: "Not Attending" };
  const submission = () => {
    const selected = attendanceInputs.find((input) => input.checked);
    if (!selected || !Object.prototype.hasOwnProperty.call(attendanceValues, selected.value)) return null;
    return {
      type: "weddingRSVP",
      guestName: nameInput.value.trim(),
      attendance: attendanceValues[selected.value],
      guestCount: selected.value === "accepts" ? 1 : 0,
      message: "",
      invitationId: "",
    };
  };
  const showStatus = (message) => {
    status.textContent = message;
    status.className = "rsvp-form__status";
  };
  const updateSubmitButton = () => {
    submitButton.disabled = submitting || JSON.stringify(submission()) === confirmedSubmission;
  };

  const clearError = (input, error) => {
    input.removeAttribute("aria-invalid");
    error.textContent = "";
  };

  nameInput.addEventListener("input", () => {
    clearError(nameInput, nameError);
    if (!submitting) showStatus("");
    updateSubmitButton();
  });
  attendanceInputs.forEach((input) => {
    input.addEventListener("change", () => {
      attendanceInputs.forEach((choice) => choice.removeAttribute("aria-invalid"));
      attendanceError.textContent = "";
      if (!submitting) showStatus("");
      updateSubmitButton();
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitting) return;
    showStatus("");

    const nameIsValid = nameInput.value.trim().length > 0;
    const payload = submission();

    if (!nameIsValid) {
      nameInput.setAttribute("aria-invalid", "true");
      nameError.textContent = "Please enter your full name.";
    } else {
      clearError(nameInput, nameError);
    }

    if (!payload) {
      attendanceInputs.forEach((input) => input.setAttribute("aria-invalid", "true"));
      attendanceError.textContent = "Please select whether you can attend.";
    } else {
      attendanceInputs.forEach((input) => input.removeAttribute("aria-invalid"));
      attendanceError.textContent = "";
    }

    if (!nameIsValid || !payload) {
      (nameIsValid ? attendanceInputs[0] : nameInput).focus();
      return;
    }

    const body = JSON.stringify(payload);
    if (body === confirmedSubmission) {
      showStatus("Your RSVP has already been recorded. Thank you!");
      updateSubmitButton();
      return;
    }

    submitting = true;
    updateSubmitButton();
    submitButton.textContent = "Sending...";
    form.setAttribute("aria-busy", "true");
    const fields = [nameInput, ...attendanceInputs];
    const disabledStates = fields.map((field) => field.disabled);
    fields.forEach((field) => { field.disabled = true; });
    showStatus("Sending your RSVP...");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    try {
      // Plain-text JSON avoids an application/json preflight. CORS still applies
      // to the redirected response: an unreadable response is never success.
      const response = await fetch(endpoint, {
        method: "POST",
        mode: "cors",
        credentials: "omit",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body,
        signal: controller.signal,
      });
      if (!response.ok || response.type === "opaque") throw new Error("Unconfirmed RSVP");
      const acknowledgment = await response.json();
      if (acknowledgment?.success === true &&
          (acknowledgment.type === undefined || acknowledgment.type === "weddingRSVP")) {
        confirmedSubmission = body;
        showStatus("Thank you! Your RSVP has been recorded.");
      } else if (acknowledgment?.success === false) {
        showStatus("We couldn't save your RSVP. Please try again. If this continues, contact Nico & Kaye.");
      } else {
        throw new Error("Unconfirmed RSVP");
      }
    } catch {
      // A timeout, CORS error, or lost response can happen after a sheet write.
      // Do not retry automatically or claim that nothing was saved.
      showStatus("We couldn't confirm whether your RSVP was saved. Please check with Nico & Kaye before trying again.");
    } finally {
      window.clearTimeout(timeout);
      fields.forEach((field, index) => { field.disabled = disabledStates[index]; });
      submitting = false;
      submitButton.textContent = submitLabel;
      form.removeAttribute("aria-busy");
      updateSubmitButton();
      status.focus({ preventScroll: true });
    }
  });
}

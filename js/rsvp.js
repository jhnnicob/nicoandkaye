const form = document.querySelector("[data-rsvp-form]");

if (form) {
  const nameInput = form.querySelector('[name="guestName"]');
  const attendanceInputs = [...form.querySelectorAll('[name="attendance"]')];
  const nameError = form.querySelector("#rsvp-name-error");
  const attendanceError = form.querySelector("#rsvp-attendance-error");
  const status = form.querySelector("[data-rsvp-status]");

  const clearError = (input, error) => {
    input.removeAttribute("aria-invalid");
    error.textContent = "";
  };

  nameInput.addEventListener("input", () => clearError(nameInput, nameError));
  attendanceInputs.forEach((input) => {
    input.addEventListener("change", () => {
      attendanceInputs.forEach((choice) => choice.removeAttribute("aria-invalid"));
      attendanceError.textContent = "";
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    status.textContent = "";

    const nameIsValid = nameInput.value.trim().length > 0;
    const selectedAttendance = attendanceInputs.find((input) => input.checked);

    if (!nameIsValid) {
      nameInput.setAttribute("aria-invalid", "true");
      nameError.textContent = "Please enter your full name.";
    } else {
      clearError(nameInput, nameError);
    }

    if (!selectedAttendance) {
      attendanceInputs.forEach((input) => input.setAttribute("aria-invalid", "true"));
      attendanceError.textContent = "Please select whether you can attend.";
    } else {
      attendanceInputs.forEach((input) => input.removeAttribute("aria-invalid"));
      attendanceError.textContent = "";
    }

    if (!nameIsValid || !selectedAttendance) {
      (nameIsValid ? attendanceInputs[0] : nameInput).focus();
      return;
    }

    status.textContent = "Your details are complete, but this website is not connected to an RSVP service. Your response has not been sent.";
    status.className = "rsvp-form__status rsvp-form__status--notice";
  });
}
import { useEffect, useRef, useState } from "react";
import { readApiJson } from "../utils/api.js";

function Review() {
  const [reviews, setReviews] = useState([]);
  const [reviewsLoadFailed, setReviewsLoadFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [isThankYouOpen, setIsThankYouOpen] = useState(() => {
    return window.sessionStorage.getItem("reviewSubmitted") === "true";
  });
  const reviewDialogRef = useRef(null);
  const thankYouDialogRef = useRef(null);

  useEffect(() => {
    const dialog = reviewDialogRef.current;
    if (isReviewFormOpen && dialog && !dialog.open) dialog.showModal();
    if (!isReviewFormOpen && dialog?.open) dialog.close();
  }, [isReviewFormOpen]);

  useEffect(() => {
    const dialog = thankYouDialogRef.current;
    if (isThankYouOpen) {
      window.sessionStorage.removeItem("reviewSubmitted");
      if (dialog && !dialog.open) dialog.showModal();
    }
    if (!isThankYouOpen && dialog?.open) dialog.close();
  }, [isThankYouOpen]);

  useEffect(() => {
    fetch("/api/reviews")
      .then((response) => readApiJson(response, "Unable to load reviews."))
      .then(({ reviews: approvedReviews }) => setReviews(approvedReviews))
      .catch((error) => {
        console.error("Unable to load reviews.", error);
        setReviewsLoadFailed(true);
      });
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: Number(formData.get("appointmentId")),
          email: formData.get("email"),
          rating: Number(formData.get("rating")),
          reviewText: formData.get("reviewText"),
        }),
      });
      await readApiJson(response, "Unable to submit your review.");
      window.sessionStorage.setItem("reviewSubmitted", "true");
      window.location.assign("/");
    } catch (error) {
      console.error("Unable to submit your review.", error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="review" id="review">
      <p className="review-title">WHAT OUR CLIENTS SAY</p>
      {!reviewsLoadFailed && reviews.length === 0 && (
        <p className="review-feedback" role="status">
          No approved reviews yet. Be the first to share your experience.
        </p>
      )}
      <div className="review-content">
        {reviews.map((review) => (
          <article className="review-item" key={review.id}>
            <p className="review-star" aria-label={`${review.rating} out of 5 stars`}>
              {"★".repeat(review.rating)}
              {"☆".repeat(5 - review.rating)}
            </p>
            {review.reviewText && <p className="review-text">{review.reviewText}</p>}
            <p className="review-author">— {review.author}</p>
          </article>
        ))}
      </div>
      <button
        className="btn btn-primary review-open-button"
        type="button"
        onClick={() => setIsReviewFormOpen(true)}
      >
        Leave a review
      </button>
      <dialog
        className="review-dialog"
        ref={reviewDialogRef}
        aria-labelledby="review-form-title"
        onClose={() => setIsReviewFormOpen(false)}
      >
        <form className="review-form" onSubmit={handleSubmit}>
          <button
            className="review-dialog-close"
            type="button"
            aria-label="Close review form"
            onClick={() => setIsReviewFormOpen(false)}
          >
            &times;
          </button>
          <h2 id="review-form-title">Share your experience</h2>
          <p>
            Reviews are available after your appointment is confirmed. Enter
            the appointment number shown after payment and the email used to
            book.
          </p>
          <label>
            Appointment number
            <input
              type="number"
              name="appointmentId"
              min="1"
              step="1"
              required
            />
          </label>
          <label>
            Booking email
            <input type="email" name="email" maxLength="254" required />
          </label>
          <label>
            Rating
            <select name="rating" defaultValue="5" required>
              <option value="5">5 stars</option>
              <option value="4">4 stars</option>
              <option value="3">3 stars</option>
              <option value="2">2 stars</option>
              <option value="1">1 star</option>
            </select>
          </label>
          <label>
            Your review
            <textarea name="reviewText" maxLength="2000" required />
          </label>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit review"}
          </button>
        </form>
      </dialog>
      <dialog
        className="review-dialog review-thank-you"
        ref={thankYouDialogRef}
        aria-labelledby="review-thank-you-title"
        onClose={() => setIsThankYouOpen(false)}
      >
        <div className="review-form">
          <h2 id="review-thank-you-title">Thank you!</h2>
          <p>
            Your review has been submitted and will appear after it is approved.
          </p>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => setIsThankYouOpen(false)}
          >
            Close
          </button>
        </div>
      </dialog>
    </section>
  );
}

export default Review;

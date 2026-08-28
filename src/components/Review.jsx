//this component is for the reviews
//for now it will be a placeholder, but it will eventually display customer reviews and testimonials

function Review() {
  return (
    <section className="review" id="review">
      <p className="review-title">WHAT OUR CLIENTS SAY</p>
      <div className="review-content">
        <div className="review-item">
          <p className="review-star">★★★★★</p>
          <p className="review-text">
            "Great experience! The salon is beautiful, easy to navigate, and
            makes booking appointments simple. It has a clean, professional
            design and provides all the information you need. Highly
            recommended!"
          </p>
          <p className="review-author">- Michelle Doe</p>
        </div>
        <div className="review-item">
          <p className="review-star">★★★★★</p>
          <p className="review-text">
            "Absolutely loved my braids! The team was so professional and
            attentive. My hair looked stunning and the process was much more
            comfortable than expected. Will definitely be coming back soon!"
          </p>
          <p className="review-author">- Amara Johnson</p>
        </div>
        <div className="review-item">
          <p className="review-star">★★★★★</p>
          <p className="review-text">
            "My lash extensions are everything I wanted. The stylist took her
            time to understand what I was looking for and the result exceeded my
            expectations. Booking was smooth and easy."
          </p>
          <p className="review-author">- Sophia Williams</p>
        </div>
      </div>
    </section>
  );
}

export default Review;

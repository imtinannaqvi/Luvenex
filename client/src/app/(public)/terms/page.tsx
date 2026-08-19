import React from 'react'

const page = () => {
  return (
   <div className="bg-black text-white min-h-screen px-4 sm:px-6 py-12 sm:py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Terms & Conditions</h1>
        <p className="text-zinc-500 text-xs mb-10">Last updated: July 2026</p>

        <div className="space-y-8 text-sm text-zinc-300 leading-relaxed">
          <section>
            <h2 className="text-white font-semibold text-base mb-2">1. Acceptance of Terms</h2>
            <p>
              By creating an account on Luvenex, you agree to be bound by these Terms & Conditions.
              If you do not agree, please do not use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-2">2. Platform Role</h2>
            <p>
              Luvenex connects brands and influencers for paid collaborations and holds payment in
              escrow until agreed deliverables are completed and approved. Luvenex charges a 10%
              commission on each completed deal, split 5% to the brand and 5% to the influencer.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-2">3. Brand Responsibilities</h2>
            <p>
              Brands agree to fund escrow in good faith, review delivered work promptly, and provide
              accurate campaign or gig requirements. Brands may not request work outside the agreed
              scope without a new agreement.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-2">4. Influencer Responsibilities</h2>
            <p>
              Influencers agree to deliver work that matches the agreed scope and deadline, and to
              communicate honestly about progress or delays. Content submitted must be original and
              not infringe on third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-2">5. Payments & Escrow</h2>
            <p>
              All payments are held in escrow until approved by the brand, or automatically released
              after 5 days if the brand does not respond. Withdrawals require identity verification (KYC).
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-2">6. Prohibited Conduct</h2>
            <p>
              Users may not attempt to bypass the platform to avoid fees, harass other users, submit
              false information, or use the platform for any unlawful purpose. Violations may result in
              suspension or termination of your account.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-2">7. Account Suspension & Termination</h2>
            <p>
              Luvenex reserves the right to suspend or terminate accounts that violate these terms,
              engage in fraudulent activity, or pose a risk to other users of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-2">8. Limitation of Liability</h2>
            <p>
              Luvenex is not liable for disputes arising from the quality of work delivered, so long as
              the platform's escrow and dispute processes were followed in good faith.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-2">9. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of the platform after changes
              constitutes acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-2">10. Contact</h2>
            <p>
              Questions about these terms can be sent to support@luvenex.com or through our{" "}
              <a href="/contact" className="text-red-500 hover:underline">Contact page</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default page

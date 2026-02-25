import React from 'react';

const CookiePolicy: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-white pt-40 pb-20 px-8 md:px-20 z-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold text-black mb-16 tracking-tight text-center">
          Cookie Policy
        </h1>

        <div className="prose prose-lg max-w-none text-lw-text-body space-y-12">
          <section>
            <p>
              At Lifewood Data Technology Ltd., we use cookies and similar tracking technologies to enhance your experience, analyze site usage, and personalize content. This Cookie Policy explains what cookies are, how we use them, and how you can manage your preferences.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-black mb-6">1. What Are Cookies?</h2>
            <div className="space-y-4">
              <p>
                Cookies are small text files that are stored on your device (computer, smartphone, or tablet) when you visit a website. They are used to store and track information about your actions and preferences, enabling the website to function properly and deliver a personalized experience.
              </p>
              <p>There are several types of cookies:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Session Cookies:</strong> Temporary cookies that expire once you close your browser. These are used to track your activity during a single session.</li>
                <li><strong>Persistent Cookies:</strong> These cookies remain on your device until they expire or are deleted, allowing the website to remember your preferences across sessions.</li>
                <li><strong>First-party Cookies:</strong> Cookies set by the website you are visiting.</li>
                <li><strong>Third-party Cookies:</strong> Cookies set by a domain other than the website you are visiting, often used for advertising and analytics purposes.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-black mb-6">2. How Lifewood Uses Cookies</h2>
            <div className="space-y-4">
              <p>
                We use cookies to improve your browsing experience, streamline functionality, and enhance the performance of our website. Specifically, Lifewood uses cookies for the following purposes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Essential Cookies:</strong> These cookies are necessary for the website to function properly. They allow you to navigate the site and use its features, such as accessing secure areas and completing transactions.</li>
                <li><strong>Performance and Analytics Cookies:</strong> These cookies help us understand how visitors interact with our website by collecting information on site traffic, page views, and other key metrics. This data is used to improve the website’s performance and usability.</li>
                <li><strong>Functionality Cookies:</strong> These cookies allow the website to remember your preferences and provide enhanced, personalized features. For example, they may remember your login details or language settings.</li>
                <li><strong>Targeting and Advertising Cookies:</strong> These cookies are used to deliver relevant advertisements based on your browsing habits and to measure the effectiveness of our marketing campaigns. They may track your visit across different websites.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-black mb-6">3. Third-Party Cookies</h2>
            <div className="space-y-4">
              <p>
                We may allow third-party service providers, such as Google Analytics or social media platforms, to place cookies on your device to track usage, improve site functionality, and deliver targeted ads. These third parties may have access to certain information about your browsing habits but will not be able to identify you personally from this data.
              </p>
              <p>
                We recommend reviewing the privacy policies of these third parties to understand how they handle your data.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-black mb-6">4. Your Cookie Choices</h2>
            <div className="space-y-4">
              <p>
                You have the right to accept or reject cookies. When you visit our website for the first time, you will be asked to consent to the use of cookies through a cookie banner. You can also manage or disable cookies by adjusting your browser settings.
              </p>
              <p>Here’s how you can control cookies in popular browsers:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Google Chrome:</strong> Go to Settings &gt; Privacy and Security &gt; Cookies and other site data</li>
                <li><strong>Mozilla Firefox:</strong> Go to Options &gt; Privacy &amp; Security &gt; Cookies and Site Data</li>
                <li><strong>Microsoft Edge:</strong> Go to Settings &gt; Site Permissions &gt; Cookies and site data</li>
                <li><strong>Safari:</strong> Go to Preferences &gt; Privacy &gt; Cookies and website data</li>
              </ul>
              <p>
                Please note that disabling certain cookies may affect the functionality of our website and limit your ability to use some of its features.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-black mb-6">5. Managing Cookies on Lifewood</h2>
            <div className="space-y-4">
              <p>
                You can manage your cookie preferences at any time by clicking on the "Cookie Settings" link in the footer of our website. From there, you can opt out of non-essential cookies, such as performance and marketing cookies.
              </p>
              <p>
                If you do not want to receive cookies, you can also modify your browser settings to notify you when cookies are being used or to block cookies altogether. However, please be aware that some parts of our website may not function properly if you block essential cookies.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-black mb-6">6. Changes to This Cookie Policy</h2>
            <div className="space-y-4">
              <p>
                We may update this Cookie Policy from time to time to reflect changes in our practices, legal requirements, or the services we offer. We encourage you to review this page periodically to stay informed about how we use cookies.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-black mb-6">7. Contact Us</h2>
            <div className="space-y-4">
              <p>
                If you have any questions about our use of cookies or how to manage your preferences, please contact us at:
              </p>
              <p className="font-bold">
                lifewood@gmail.com
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;

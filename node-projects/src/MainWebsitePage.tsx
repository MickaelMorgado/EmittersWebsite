import React, { useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const MainWebsitePage = () => {
    const [scriptsLoaded, setScriptsLoaded] = useState(false);

    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);
    const scriptUrls = [
      './src/assets/js/vendor/jquery.min.js',
      './src/assets/js/vendor/gsap.min.js',
      './src/assets/js/vendor/ScrollMagic.min.js',
      './src/assets/js/vendor/animation.gsap.min.js',
      './src/assets/js/vendor/ScrollTrigger.min.js',
      './src/assets/js/vendor/Observer.min.js',
      './src/assets/js/vendor/MotionPathPlugin.min.js',
      './src/assets/js/vendor/CustomEase.min.js',
      './src/assets/js/elements.js',
      './src/assets/js/main.js',
      //'./src/assets/js/animations.js'
      './src/assets/js/vendor/HipsHome.js'
    ];

    // Dynamically load scripts
    const loadScript = (url: string) => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    Promise.all(scriptUrls.map(loadScript))
      .then(() => setScriptsLoaded(true))
      .catch((error) => console.error('Error loading scripts:', error));

    return () => {
      // Clean up by removing dynamically added scripts when component unmounts
      scriptUrls.forEach(url => {
        const script = document.querySelector(`script[src="${url}"]`);
        if (script) {
          document.head.removeChild(script);
        }
      });
    };
  }, []); // Empty dependency array ensures effect runs only once on mount

    // Content Animations:
  useEffect(() => {
    const contentElements = document.getElementsByClassName('content');
    const contentArray = Array.from(contentElements);

    contentArray.forEach((contentElement, index) => {
      gsap.to(contentElement, {
        x: '0',
        opacity: 1,
        duration: 2,
        scrollTrigger: {
          trigger: contentElement.parentElement,
          start: '-25% center',
          end: '25% center',
          scrub: 1,
          id: `contentAnimation-${index}`,
        },
      });
    });
  }, []);

  // HTML content of your existing webpage
  const webpageContent = `

  <head>
    <title>Hips</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <script src="./src/assets/js/vendor/jquery.min.js"></script>
    <script src="./src/assets/js/vendor/gsap.min.js"></script>
    <script src="./src/assets/js/vendor/ScrollMagic.min.js"></script>
    <script src="./src/assets/js/vendor/animation.gsap.min.js"></script>
    <script src="./src/assets/js/vendor/ScrollTrigger.min.js"></script>
    <script src="./src/assets/js/vendor/Observer.min.js"></script>
    <script src="./src/assets/js/vendor/MotionPathPlugin.min.js"></script>
    <script src="./src/assets/js/vendor/CustomEase.min.js"></script>

    <!--
      <script src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/16327/MotionPathHelper.min.js?v=46"></script>
      more at: https://codepen.io/fr3d3ric/pen/NWWJoMg
    -->
    <link rel="stylesheet" href="./src/assets/styles/vendor/all.css">
    <link rel="stylesheet" href="./src/assets/styles/vendor/bootstrap.min.css">
    <link rel="stylesheet" href="./src/assets/styles/vendor/main.min.css">
    <link rel="stylesheet" href="./src/assets/styles/animations.css">
    <link rel="stylesheet" href="./src/assets/styles/styles.css">
  </head>
  <body class="page-home">
    <header>
      <div class="navbar-main-container">
        <img src="https://cdn.hips.com/assets/logotypes/redux/color/hips-aa696dfa4c50892d2ae12a1c4aebaeb96bcbb8f169c706bc0cd7382f03cdaa8d.svg" alt="Hips" width="84px">
        <div class="navbar-main-content">
          <div class="navbar-main-mobile-header">
            <a class="navbar-main-brand" href="https://hips.com/pt/home">
              <i class="navbar-main-brand-icon icon fab fa-hips"></i>
            </a>
          </div>
          <ul class="navbar-main-nav">
            <li class="navbar-main-nav-item"><a class="navbar-main-nav-link" href="https://hips.com/pt/terminals">Payment Products</a></li>
            <li class="navbar-main-nav-item"><a class="navbar-main-nav-link" href="https://hips.com/pt/resources">Resources</a></li>
            <li class="navbar-main-nav-item"><a class="navbar-main-nav-link" href="https://hips.com/pt/pricing">Pricing</a></li>
            <li class="navbar-main-nav-item"><a class="navbar-main-nav-link" href="https://hips.com/pt/store">Store</a></li>
            <li class="navbar-main-nav-item"><a class="navbar-main-nav-link" href="https://jobs.hips.com/" target="_blank">Careers</a></li>
          </ul>
        </div>
        <div class="navbar-main-content-btn topnav">
          <div class="cart-wrapper" data-totalitems="0" id="cart">
            <a class="navbar-main-btn btn btn-outline-primary" href="https://hips.com/pt/store">Shop Now</a>
          </div>
          <a class="navbar-main-btn btn btn-primary" href="https://dashboard.hips.com/users/sign_in">Sign In</a>
          <button class="btn navbar-main-toggler" data-open-navbar-main="" type="button">
            <span class="navbar-main-toggler-item"></span>
            <span class="navbar-main-toggler-item"></span>
            <span class="navbar-main-toggler-item"></span>
          </button>
        </div>
      </div>
    </header>

    <div id="pos-animation" class="pos-animation"></div>

    <div id="gsap-pos-area">
      <div id="pos-animation-points" class="pos-animation-points">
        <div class="d-point d-point--1"></div>
        <div class="d-point d-point--2"></div>
        <div class="d-point d-point--3"></div>
        <div class="d-point d-point--4"></div>
        <div class="d-point d-point--5"></div>
      </div>

      <div id="pos-animation-svg">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 200">
          <path fill="none" />
        </svg>
      </div>

      <section id="section0" class="banner vignette">
        <div class="caption">
          <p class="caption-title">Add payment services to your offering.</p>
          <a class="custom-btn">scroll down</a>
        </div>
        <!--div id="preloader-animation" class="preloader preloader--active">
          <div id="pos-animation-idle" class="pos-animation-idle">
            <div class="pos pos-white"></div>
            <div class="pos pos-black"></div>
          </div>
          <div class="preloader--spinner"></div>
        </div-->
      </section>
      <section id="section1">
        <div class="container">
          <div class="content content--1">
            <p class="title">PAX A920</p>
            <p class="subtitle">Standalone, Android</p>
            <p>
              The most beautiful and popular mobile payment terminal powered with
              Android
            </p>
            <ul>
              <li>Bringing elegance & style to each paying customer</li>
              <li>
                Transform the customer experience with a new leading-edge solution
              </li>
              <li>Take advantage of an Android community business application</li>
              <li>
                Speed up the checkout process, accepting all payment methods
                including alternative ones
              </li>
              <li>Support daily business through cloud services capabilities</li>
            </ul>
          </div>
        </div>
      </section>
      <section id="section2">
        <div class="container">
          <div class="content content--2">
            <p class="title">APOS A8</p>
            <p class="subtitle">Standalone, Android</p>
            <p>
              The most beautiful and popular mobile payment terminal powered with
              Android
            </p>
            <ul>
              <li>Bringing elegance & style to each paying customer</li>
              <li>
                Transform the customer experience with a new leading-edge solution
              </li>
              <li>Take advantage of an Android community business application</li>
              <li>
                Speed up the checkout process, accepting all payment methods
                including alternative ones
              </li>
              <li>Support daily business through cloud services capabilities</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
    <section>
      <div class="section-container section-advantage">
        <div class="section-advantage-title">HIPS ADVANTAGE</div>
        <h2>100% partnership driven omnichannel white label payment gateway.</h2>
        <div class="section-advantage-subheading">Build or scale a domestic or global payment business. Whether its In-Store, mPOS, Unattended, QR or Online payments.</div>
        <div class="section-advantage-carousel"><div class="section-advantage-carousel-inner"><div class="section-advantage-carousel-content"><div class="section-advantage-carousel-content-list"><div class="section-advantage-carousel-item out-left" data-text="PayPal Globally"><div class="section-advantage-carousel-circle bg-purple"></div><div class="section-advantage-carousel-icon"><img src="https://cdn.hips.com/assets/logotypes/redux/white/paypal-717eeac9c6065d94242c4f528af9238afae5e93501f4befaf8c3eea0fa9c5a43.svg" alt="Paypal"></div></div><div class="section-advantage-carousel-item" data-text="Vipps in Norway"><div class="section-advantage-carousel-circle bg-orange"></div><div class="section-advantage-carousel-icon"><img src="https://cdn.hips.com/assets/logotypes/redux/white/vipps-0b84de0be7fd05bf272728a97cd6d4b3887bc3987d1637a0106b431c97b1c4ce.svg" alt="Vipps"></div></div><div class="section-advantage-carousel-item" data-text="Swish in Sweden"><div class="section-advantage-carousel-circle bg-blue"></div><div class="section-advantage-carousel-icon"><img src="https://cdn.hips.com/assets/logotypes/redux/white/swish-aaefc3751042cbe861f6efed498c5949be7040d4ea2ac09ff9cb5152283fdb84.svg" alt="Swish"></div></div><div class="section-advantage-carousel-item scale" data-text="WeChat Pay in 70+ countries"><div class="section-advantage-carousel-circle bg-green"></div><div class="section-advantage-carousel-icon"><img src="https://cdn.hips.com/assets/logotypes/redux/white/wechatpay-9455204066601d2b23377f0eee556c57a0489f7b725659aaa9dbef29ba94004a.svg" alt="Wechatpay"></div></div><div class="section-advantage-carousel-item scale" data-text="SEPA Direct Debit in EU"><div class="section-advantage-carousel-circle bg-dark"></div><div class="section-advantage-carousel-icon"><img src="https://cdn.hips.com/assets/logotypes/redux/white/sepa-1c40e902e06134232041d928560cba1ae7a115e77c28eb028b9781a530199e7e.svg" alt="Sepa"></div></div><div class="section-advantage-carousel-item scale" data-text="Bancontact in Belgium"><div class="section-advantage-carousel-circle bg-teal"></div><div class="section-advantage-carousel-icon"><img src="https://cdn.hips.com/assets/logotypes/redux/white/bancontact-6e60c01f48f6bf5255878190af6499dc3c98d40d79f4b54a05912c9dde5a1e43.svg" alt="Bancontact"></div></div><div class="section-advantage-carousel-item" data-text="GiroPay in Germany"><div class="section-advantage-carousel-circle bg-pink"></div><div class="section-advantage-carousel-icon"><img src="https://cdn.hips.com/assets/logotypes/redux/white/giropay-3aaf019b94d4499ce7611c07e8519f6a932df034da04a3871c2089073b1b7ce7.svg" alt="Giropay"></div></div><div class="section-advantage-carousel-item" data-text="iDeal in the Netherlands"><div class="section-advantage-carousel-circle bg-purple"></div><div class="section-advantage-carousel-icon"><img src="https://cdn.hips.com/assets/logotypes/redux/white/ideal-35664390409a4be9928247a38fb55d226b03134f69bcb2c9a200a2cd97565d9e.svg" alt="Ideal"></div></div><div class="section-advantage-carousel-item" data-text="Multibanco in Portugal"><div class="section-advantage-carousel-circle bg-orange"></div><div class="section-advantage-carousel-icon"><img src="https://cdn.hips.com/assets/logotypes/redux/white/multibanco-7ecf473bd9dc82836f1e90c93e146f166c4c6572ce32a191d31d024ab86b3754.svg" alt="Multibanco"></div></div><div class="section-advantage-carousel-item" data-text="OXXO in Mexico"><div class="section-advantage-carousel-circle bg-blue"></div><div class="section-advantage-carousel-icon"><img src="https://cdn.hips.com/assets/logotypes/redux/white/oxxo-4bb72d8f7115752cbb91390aba882d82364146f2c17c3827d3390e56da6c4422.svg" alt="Oxxo"></div></div><div class="section-advantage-carousel-item" data-text="Przelewy24 in Poland"><div class="section-advantage-carousel-circle bg-green"></div><div class="section-advantage-carousel-icon"><img src="https://cdn.hips.com/assets/logotypes/redux/white/przelewy24-0f752a488cfd71558b7ded9419e9714797dbcbbbd4f2ef171dfdefff8881e6e8.svg" alt="Przelewy24"></div></div><div class="section-advantage-carousel-item" data-text="Sofort in Benelux"><div class="section-advantage-carousel-circle bg-orange"></div><div class="section-advantage-carousel-icon"><img src="https://cdn.hips.com/assets/logotypes/redux/white/sofort-ee3b6bdc0c3314ffc7415954754592b53f464f772bc885adfa56d15942477f9b.svg" alt="Sofort"></div></div><div class="section-advantage-carousel-item" data-text="Visa in 70+ countries"><div class="section-advantage-carousel-circle bg-dark"></div><div class="section-advantage-carousel-icon"><img src="https://cdn.hips.com/assets/logotypes/redux/white/visa-0322a88ef0fd3ae43eb544ce31705f88e5f9251db7014bbf24cdd3d08b161c03.svg" alt="Visa"></div></div><div class="section-advantage-carousel-item" data-text="Alipay globally"><div class="section-advantage-carousel-circle bg-teal"></div><div class="section-advantage-carousel-icon"><img src="https://cdn.hips.com/assets/logotypes/redux/white/alipay-8ec709b7cd9001b85215a33110e1dc8adfd73e386c8d6044a455f56fcfacbc03.svg" alt="Alipay"></div></div><div class="section-advantage-carousel-item" data-text="American Express globally"><div class="section-advantage-carousel-circle bg-pink"></div><div class="section-advantage-carousel-icon"><img src="https://cdn.hips.com/assets/logotypes/redux/white/amex-40113c9865f060c8732932874942ec17a64d14b69169963423e5248166dd7a7b.svg" alt="Amex"></div></div><div class="section-advantage-carousel-item" data-text="ApplePay in 70+ countries"><div class="section-advantage-carousel-circle bg-purple"></div><div class="section-advantage-carousel-icon"><img src="https://cdn.hips.com/assets/logotypes/redux/white/applepay-0ba266d122d5cdfcd00e26188e07095a6e74094afe79106921fa09828594ed27.svg" alt="Applepay"></div></div><div class="section-advantage-carousel-item" data-text="China Union Pay in 70+ countries"><div class="section-advantage-carousel-circle bg-orange"></div><div class="section-advantage-carousel-icon"><img src="https://cdn.hips.com/assets/logotypes/redux/white/cup-07604a7ebfe8e1b3c41e87973f9070b171ce0dfef7e07a9f63c153528c1cef73.svg" alt="Cup"></div></div><div class="section-advantage-carousel-item" data-text="EMV QR code payments Globally"><div class="section-advantage-carousel-circle bg-blue"></div><div class="section-advantage-carousel-icon"><img src="https://cdn.hips.com/assets/logotypes/redux/white/emvqr-354010a86e20aa4dee44dc3c6ed397ab371cca5b1971a0b7ded23f5b3b07b2ad.svg" alt="Emvqr"></div></div><div class="section-advantage-carousel-item" data-text="Google Pay in 70+ countries"><div class="section-advantage-carousel-circle bg-green"></div><div class="section-advantage-carousel-icon"><img src="https://cdn.hips.com/assets/logotypes/redux/white/gpay-3ebaaf31acd647e7e013ba0979744afa7c466a869b1a249defdd2b6692310a5a.svg" alt="Gpay"></div></div><div class="section-advantage-carousel-item" data-text="JCB in 70+ countries"><div class="section-advantage-carousel-circle bg-dark"></div><div class="section-advantage-carousel-icon"><img src="https://cdn.hips.com/assets/logotypes/redux/white/jcb-bb09ac97da03bbad6e971336c6ded18867aac29d5207769e87c717e59a7820b1.svg" alt="Jcb"></div></div><div class="section-advantage-carousel-item" data-text="Maestro in 70+ countries"><div class="section-advantage-carousel-circle bg-teal"></div><div class="section-advantage-carousel-icon"><img src="https://cdn.hips.com/assets/logotypes/redux/white/maestro-b34e04974e314773420ab279d697d9bfd7905a5e3953da0496badf50f9feae54.svg" alt="Maestro"></div></div><div class="section-advantage-carousel-item" data-text="MasterCard in 70+ countries"><div class="section-advantage-carousel-circle bg-pink"></div><div class="section-advantage-carousel-icon"><img src="https://cdn.hips.com/assets/logotypes/redux/white/mastercard-a417d60f0e34ceef788c66100047d949af5f4d0c47fefbb0f83d49ab65bafbb8.svg" alt="Mastercard"></div></div><div class="section-advantage-carousel-item out-right" data-text="PayPal Globally"><div class="section-advantage-carousel-circle bg-purple"></div><div class="section-advantage-carousel-icon"><img src="https://cdn.hips.com/assets/logotypes/redux/white/paypal-717eeac9c6065d94242c4f528af9238afae5e93501f4befaf8c3eea0fa9c5a43.svg" alt="Paypal"></div></div></div></div></div><div class="section-advantage-carousel-info"><div class="section-advantage-carousel-info-icon-wrapper"><div class="section-advantage-carousel-info-icon-container bg-dark active pop"></div><div class="section-advantage-carousel-info-icon-container bg-teal"></div><div class="section-advantage-carousel-info-icon-container bg-pink"></div><div class="section-advantage-carousel-info-icon-container bg-purple"></div><div class="section-advantage-carousel-info-icon-container bg-orange"></div><div class="section-advantage-carousel-info-icon-container bg-blue"></div><div class="section-advantage-carousel-info-icon-container bg-green"></div><img src="https://cdn.hips.com/assets/logotypes/redux/white/sepa-1c40e902e06134232041d928560cba1ae7a115e77c28eb028b9781a530199e7e.svg" alt="Hips greendot"></div><div class="section-advantage-carousel-info-title"><div class="section-advantage-carousel-info-title-text">WeCha</div></div></div></div>
        <a class="btn btn-outline-primary" href="https://hips.com/pt/terminals">Explore Payment Products<i class="icon icon-arrow-right"></i></a>
      </div>
    </section>
    <footer class="footer-main">
      <div class="footer-main-top">
        <div class="section-container">
          <div class="footer-main-top-row">
            <div class="footer-main-top-col">
              <a href="https://hips.com/pt/home">
                <img class="footer-main-top-col-logo" src="https://cdn.hips.com/assets/logotypes/redux/white/hips-greendot-b22bba88b69457f1e4f5f75bb7341a3fb1481e894ff081856caa628575848471.svg" alt="Hips greendot">
              </a>
            </div>
            <div class="footer-main-top-col">
              <div class="footer-main-top-col">
                <div class="footer-main-top-nav-title">PAYMENT PRODUCTS</div>
                <div class="footer-main-top-nav">
                  <a class="footer-main-top-nav-link" href="https://hips.com/pt/qr">QR Payments</a>
                  <a class="footer-main-top-nav-link" href="https://hips.com/pt/terminals">Payment Terminals</a>
                  <a class="footer-main-top-nav-link" href="https://hips.com/pt/mobile-webb-payments">Mobile/Webb Payments</a>
                  <a class="footer-main-top-nav-link" href="https://hips.com/pt/open-banking-payments">Open Banking Payments</a>
                  <a class="footer-main-top-nav-link" href="https://hips.com/pt/card-issuing">Card Issuing</a>
                  <a class="footer-main-top-nav-link" href="https://hips.com/pt/payment-facilitator">PayFac</a>
                  <a class="footer-main-top-nav-link" href="https://hips.com/pt/white-label-payment-gateway">Payment Gateway</a>
                </div>
              </div>
            </div>
            <div class="footer-main-top-col"><div class="footer-main-top-nav-title">TERMINALS</div><div class="footer-main-top-nav"><a class="footer-main-top-nav-link" href="https://hips.com/pt/terminals_m010">M010 (mPos/PIN pad)</a><a class="footer-main-top-nav-link" href="https://hips.com/pt/terminals_m020">M020 (mPos/PIN pad)</a><a class="footer-main-top-nav-link" href="https://hips.com/pt/terminals_p400">P400 (Countertop PIN pad)</a><a class="footer-main-top-nav-link" href="https://hips.com/pt/terminals_a920">A920 (Standalone)</a><a class="footer-main-top-nav-link" href="https://hips.com/pt/terminals_im30">IM30 (Unattended)</a></div></div>
            <div class="footer-main-top-col"><div class="footer-main-top-nav-title">PRICING</div><div class="footer-main-top-nav"><a class="footer-main-top-nav-link" href="https://hips.com/pt/pricing-iso">ISO Edition</a><a class="footer-main-top-nav-link" href="https://hips.com/pt/pricing-gateway">Gateway Edition <div class="badge badge-light" style="margin-top:-2px;">WL</div></a><a class="footer-main-top-nav-link" href="https://hips.com/pt/pricing">PayFac Edition <div class="badge badge-light" style="margin-top:-2px;">WL</div></a><a class="footer-main-top-nav-link" href="https://hips.com/pt/interchange-plus-plus">Interchange (IC++)</a><a class="footer-main-top-nav-link" href="https://hips.com/pt/store">Hardware</a><a class="footer-main-top-nav-link" href="https://hips.com/pt/checkout">Shop Now</a></div></div>
            <div class="footer-main-top-col"><div class="footer-main-top-nav-title">DEVELOPERS</div><div class="footer-main-top-nav"><a class="footer-main-top-nav-link" href="https://docs.hips.com/docs" target="_blank">Docs and Guides</a><a class="footer-main-top-nav-link" href="https://docs.hips.com/reference" target="_blank">API Reference</a><a class="footer-main-top-nav-link" href="https://hips.com/pt/resources">SDKs and Resources</a></div><div class="footer-main-top-nav-title mt-3">HIPS</div><div class="footer-main-top-nav"><a class="footer-main-top-nav-link" href="https://jobs.hips.com/" target="_blank">Careers</a></div></div>
          </div>
          <div class="footer-main-top-row footer-main-top-row-social"><div class="footer-main-top-col"><div class="footer-main-top-nav-title">FOLLOW US</div><div class="footer-main-top-nav footer-main-top-nav-inline"><a class="footer-main-top-nav-link footer-main-top-nav-link-social" href="https://www.facebook.com/hipspay/" target="_blank"><i class="fab fa-facebook"></i></a><a class="footer-main-top-nav-link footer-main-top-nav-link-social" href="https://twitter.com/hips_status" target="_blank"><i class="fab fa-twitter"></i></a><a class="footer-main-top-nav-link footer-main-top-nav-link-social" href="https://www.linkedin.com/company/15154801" target="_blank"><i class="fab fa-linkedin"></i></a><a class="footer-main-top-nav-link footer-main-top-nav-link-social" href="https://github.com/hipspay" target="_blank"><i class="fab fa-github"></i></a><a class="footer-main-top-nav-link footer-main-top-nav-link-social" href="https://www.youtube.com/c/hipspay" target="_blank"><i class="fab fa-youtube"></i></a></div></div></div>
        </div>
      </div>
      <div class="footer-main-bottom">
        <div class="section-container">
          <div class="footer-main-bottom-row">
            <div class="footer-main-bottom-col">
              <small class="footer-main-bottom-copyright">© 2024 Hips</small>
              <div class="footer-main-bottom-nav">
                <a class="footer-main-bottom-nav-link" href="https://hips.com/pt/terms">Terms</a>
                <a class="footer-main-bottom-nav-link" href="https://hips.com/pt/data_policy">Privacy</a>
              </div>
            </div>
            <div class="footer-main-bottom-col">
              <div class="footer-main-bottom-nav">
                <a class="footer-main-bottom-nav-link" href="https://status.hips.com" target="_blank">System status</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
    <script src="./src/assets/js/elements.js"></script>
    <script src="./src/assets/js/main.js"></script>
    <script src="./src/assets/js/animations.js"></script>
  </body>

  <script src="./src/assets/js/vendor/HipsHome.js"></script>
  <!--div id="viewportResolution" style="position: fixed; bottom: 0; z-index: 1000; background: white;"></div>
  <script>
    // Function to update viewport resolution
    function updateViewportResolution() {
      // Get the viewport resolution
      var width = window.innerWidth;
      var height = window.innerHeight;

      // Display the viewport resolution in the div
      var viewportResolutionDiv = document.getElementById("viewportResolution");
      viewportResolutionDiv.textContent = "Viewport Resolution: " + width + "x" + height;
    }

    // Initial call to update the viewport resolution
    updateViewportResolution();

    // Event listener to update viewport resolution on window resize
    window.addEventListener("resize", updateViewportResolution);
  </script-->


  `;

  return (
    <div>
        <div dangerouslySetInnerHTML={{ __html: webpageContent }} />
    </div>
  );
};

export default MainWebsitePage;
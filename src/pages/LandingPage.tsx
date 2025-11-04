import { Link } from 'react-router-dom'

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-gray-200/50 dark:border-gray-800/50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z" fill="currentColor"></path>
            </svg>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">QueryBridge</h2>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <a className="text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-primary transition-colors" href="#">Docs</a>
            <a className="text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-primary transition-colors" href="#">Examples</a>
            <a className="text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-primary transition-colors" href="#">Pricing</a>
          </nav>
          <div className="flex items-center gap-4">
            <a className="hidden sm:inline-flex h-10 items-center justify-center rounded-lg bg-primary/10 px-4 text-sm font-semibold text-primary hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30 transition-colors" href="#">
              View Demo
            </a>
            <Link className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-colors" to="/signup">
              Get Started Free
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-grow">
        <section className="py-16 sm:py-24 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              <div className="text-center lg:text-left">
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">Instantly spin up data-driven backends</h1>
                <p className="mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-300 mx-auto lg:mx-0">
                  QueryBridge is a developer-focused platform that lets you connect your databases and instantly generate fully functional APIs. Focus on building your application, not the backend.
                </p>
                <div className="mt-8 flex justify-center gap-4 lg:justify-start">
                  <Link className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 text-base font-semibold text-white shadow-lg hover:bg-primary/90 transition-colors" to="/signup">
                    Get Started Free
                  </Link>
                  <a className="inline-flex h-12 items-center justify-center rounded-lg bg-primary/10 px-6 text-base font-semibold text-primary hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30 transition-colors" href="#">
                    View Demo
                  </a>
                </div>
              </div>
              <div className="rounded-xl shadow-2xl overflow-hidden">
                <div className="aspect-video w-full bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCVecNxqnb2rf2YkmoKbSTpm6UxN5sKW7MXx5X84xyDZhqn_rSF-8mh1T2nPDTZJF4SI3jOHzyl_pmNYqReoO2XHfKZ2ODkGbT4S4_8aZh9LLw9GqKbmT4p_Zx3sIA8u2ycrQZ9po2OdI6NwoMWnxKQoZoypAo1q0rrQHjO9S7ooqRAKvdnwWc_2rKu6y5JSbDkPwavtNUOvvL-98I2tkLeQETvvN_bX1Ehtz75yqRcVNUbmxXXg9qRn3jTB_jWQHGa3u0e-Wh-RNST")' }}></div>
              </div>
            </div>
          </div>
        </section>
        <section className="py-16 sm:py-24 bg-white dark:bg-gray-900/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Core Features</h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">Everything you need to build a powerful backend without the hassle.</p>
            </div>
            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col items-center text-center p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-background-light dark:bg-background-dark">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg fill="currentColor" height="28" viewBox="0 0 256 256" width="28" xmlns="http://www.w3.org/2000/svg">
                    <path d="M128,24C74.17,24,32,48.6,32,80v96c0,31.4,42.17,56,96,56s96-24.6,96-56V80C224,48.6,181.83,24,128,24Zm80,104c0,9.62-7.88,19.43-21.61,26.92C170.93,163.35,150.19,168,128,168s-42.93-4.65-58.39-13.08C55.88,147.43,48,137.62,48,128V111.36c17.06,15,46.23,24.64,80,24.64s62.94-9.68,80-24.64ZM69.61,53.08C85.07,44.65,105.81,40,128,40s42.93,4.65,58.39,13.08C200.12,60.57,208,70.38,208,80s-7.88,19.43-21.61,26.92C170.93,115.35,150.19,120,128,120s-42.93-4.65-58.39-13.08C55.88,99.43,48,89.62,48,80S55.88,60.57,69.61,53.08ZM186.39,202.92C170.93,211.35,150.19,216,128,216s-42.93-4.65-58.39-13.08C55.88,195.43,48,185.62,48,176V159.36c17.06,15,46.23,24.64,80,24.64s62.94-9.68,80-24.64V176C208,185.62,200.12,195.43,186.39,202.92Z"></path>
                  </svg>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">Connect Databases</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Seamlessly connect to PostgreSQL, MySQL, MongoDB, and more. No data migration required.</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-background-light dark:bg-background-dark">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg fill="currentColor" height="28" viewBox="0 0 256 256" width="28" xmlns="http://www.w3.org/2000/svg">
                    <path d="M69.12,94.15,28.5,128l40.62,33.85a8,8,0,1,1-10.24,12.29l-48-40a8,8,0,0,1,0-12.29l48-40a8,8,0,0,1,10.24,12.3Zm176,27.7-48-40a8,8,0,1,0-10.24,12.3L227.5,128l-40.62,33.85a8,8,0,1,0,10.24,12.29l48-40a8,8,0,0,0,0-12.29ZM162.73,32.48a8,8,0,0,0-10.25,4.79l-64,176a8,8,0,0,0,4.79,10.26A8.14,8.14,0,0,0,96,224a8,8,0,0,0,7.52-5.27l64-176A8,8,0,0,0,162.73,32.48Z"></path>
                  </svg>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">Auto-generate Endpoints</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Automatically generate RESTful APIs with full CRUD operations based on your database schema.</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-background-light dark:bg-background-dark">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg fill="currentColor" height="28" viewBox="0 0 256 256" width="28" xmlns="http://www.w3.org/2000/svg">
                    <path d="M96,104a8,8,0,0,1,8-8h64a8,8,0,0,1,0,16H104A8,8,0,0,1,96,104Zm8,40h64a8,8,0,0,0,0-16H104a8,8,0,0,0,0,16Zm128,48a32,32,0,0,1-32,32H88a32,32,0,0,1-32-32V64a16,16,0,0,0-32,0c0,5.74,4.83,9.62,4.88,9.66h0A8,8,0,0,1,24,88a7.89,7.89,0,0,1-4.79-1.61h0C18.05,85.54,8,77.61,8,64A32,32,0,0,1,40,32H176a32,32,0,0,1,32,32V168h8a8,8,0,0,1,4.8,1.6C222,170.46,232,178.39,232,192ZM96.26,173.48A8.07,8.07,0,0,1,104,168h88V64a16,16,0,0,0-16-16H67.69A31.71,31.71,0,0,1,72,64V192a16,16,0,0,0,32,0c0-5.74-4.83-9.62-4.88-9.66A7.82,7.82,0,0,1,96.26,173.48ZM216,192a12.58,12.58,0,0,0-3.23-8h-94a26.92,26.92,0,0,1,1.21,8,31.82,31.82,0,0,1-4.29,16H200A16,16,0,0,0,216,192Z"></path>
                  </svg>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">Run Pre/Post Scripts</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Add custom logic by running scripts before or after API requests for transformation and validation.</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-background-light dark:bg-background-dark">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg fill="currentColor" height="28" viewBox="0 0 256 256" width="28" xmlns="http://www.w3.org/2000/svg">
                    <path d="M211.45,116.18l-80-64a8,8,0,0,0-8.9,0l-80,64A8,8,0,0,0,40,128H56v80a8,8,0,0,0,8,8H96a8,8,0,0,0,8-8V160a8,8,0,0,1,8-8h32a8,8,0,0,1,8,8v48a8,8,0,0,0,8,8h24a8,8,0,0,0,8-8V128h16a8,8,0,0,0,5.45-11.82ZM152,152H104a8,8,0,0,1-8-8v-8a24,24,0,0,1,48,0v8A8,8,0,0,1,152,152ZM128,42.26,192.42,96H63.58Z"></path>
                  </svg>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">Serverless Execution</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Enjoy automatic scaling and no infrastructure management with our serverless platform.</p>
              </div>
            </div>
          </div>
        </section>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              <div className="order-2 lg:order-1">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Observability & Control</h2>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                  Gain full visibility into your API usage and performance with real-time tracking and detailed analytics.
                </p>
                <ul className="mt-8 space-y-4">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-primary/10 text-primary">✓</div>
                    <p className="ml-3 text-base text-gray-600 dark:text-gray-400"><span className="font-semibold text-gray-800 dark:text-gray-200">Real-time Tracking:</span> Monitor API usage, performance, and errors.</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-primary/10 text-primary">✓</div>
                    <p className="ml-3 text-base text-gray-600 dark:text-gray-400"><span className="font-semibold text-gray-800 dark:text-gray-200">API Versioning:</span> Manage different versions of your API for backward compatibility.</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-primary/10 text-primary">✓</div>
                    <p className="ml-3 text-base text-gray-600 dark:text-gray-400"><span className="font-semibold text-gray-800 dark:text-gray-200">Access Control:</span> Secure your APIs with fine-grained permissions.</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-primary/10 text-primary">✓</div>
                    <p className="ml-3 text-base text-gray-600 dark:text-gray-400"><span className="font-semibold text-gray-800 dark:text-gray-200">Rate Limiting:</span> Protect your APIs from abuse with request throttling.</p>
                  </li>
                </ul>
              </div>
              <div className="order-1 lg:order-2 rounded-xl shadow-2xl overflow-hidden">
                <div className="aspect-video w-full bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDZ2HJokObTnr5HTa6s_zhs7M-YTTF9UGNgUDhSRlfgJI1dFS7gIPxP-hKA_12-x_ViogOWrza1d0mi6y5-3BjjQJ2L_mt2bAOyf3fO33SKP2Ow36IGRXZt7QIbTxZWlaJ7tH27deDjiPAGtixxkjFO7kuvWs7yyp4RGXWy0DpZD9rPylxTLFxGy4KZqDXFB7ig3MuQQKbt70bIRFjV6WX_4HnfqAeHMdJkHLICke_3RpuE_E5i_v2DtzlfEf94nuk12GQB_uG8cRcm")' }}></div>
              </div>
            </div>
          </div>
        </section>
        <section className="py-16 sm:py-24 bg-white dark:bg-gray-900/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Start for Free</h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">Get started with QueryBridge for free and explore its powerful features. No credit card required.</p>
            </div>
            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-8 flex flex-col bg-background-light dark:bg-background-dark">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Free</h3>
                <p className="mt-4 flex items-baseline text-gray-900 dark:text-white">
                  <span className="text-5xl font-extrabold tracking-tight">$0</span>
                  <span className="ml-1 text-xl font-semibold">/month</span>
                </p>
                <Link className="mt-6 w-full inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-primary bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30 transition-colors" to="/signup">Get Started</Link>
                <ul className="mt-8 space-y-4">
                  <li className="flex items-center"><svg className="h-6 w-6 flex-shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg><span className="ml-3 text-sm text-gray-600 dark:text-gray-400">5 projects</span></li>
                  <li className="flex items-center"><svg className="h-6 w-6 flex-shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg><span className="ml-3 text-sm text-gray-600 dark:text-gray-400">100k API requests</span></li>
                  <li className="flex items-center"><svg className="h-6 w-6 flex-shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg><span className="ml-3 text-sm text-gray-600 dark:text-gray-400">Community support</span></li>
                </ul>
              </div>
              <div className="rounded-xl border-2 border-primary p-8 flex flex-col bg-background-light dark:bg-background-dark relative">
                <div className="absolute top-0 right-8 -mt-4"><span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-primary text-white">Most Popular</span></div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pro</h3>
                <p className="mt-4 flex items-baseline text-gray-900 dark:text-white">
                  <span className="text-5xl font-extrabold tracking-tight">$49</span>
                  <span className="ml-1 text-xl font-semibold">/month</span>
                </p>
                <a className="mt-6 w-full inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-primary hover:bg-primary/90 transition-colors" href="#">
                  Upgrade
                </a>
                <ul className="mt-8 space-y-4">
                  <li className="flex items-center"><svg className="h-6 w-6 flex-shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg><span className="ml-3 text-sm text-gray-600 dark:text-gray-400">Unlimited projects</span></li>
                  <li className="flex items-center"><svg className="h-6 w-6 flex-shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg><span className="ml-3 text-sm text-gray-600 dark:text-gray-400">1M API requests</span></li>
                  <li className="flex items-center"><svg className="h-6 w-6 flex-shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg><span className="ml-3 text-sm text-gray-600 dark:text-gray-400">Priority support</span></li>
                  <li className="flex items-center"><svg className="h-6 w-6 flex-shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg><span className="ml-3 text-sm text-gray-600 dark:text-gray-400">Custom domains</span></li>
                </ul>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-8 flex flex-col bg-background-light dark:bg-background-dark">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Enterprise</h3>
                <p className="mt-4 text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">Contact Us</p>
                <a className="mt-6 w-full inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-primary bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30 transition-colors" href="#">
                  Contact Us
                </a>
                <ul className="mt-8 space-y-4">
                  <li className="flex items-center"><svg className="h-6 w-6 flex-shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg><span className="ml-3 text-sm text-gray-600 dark:text-gray-400">Custom API requests</span></li>
                  <li className="flex items-center"><svg className="h-6 w-6 flex-shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg><span className="ml-3 text-sm text-gray-600 dark:text-gray-400">Dedicated support</span></li>
                  <li className="flex items-center"><svg className="h-6 w-6 flex-shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg><span className="ml-3 text-sm text-gray-600 dark:text-gray-400">Enterprise features</span></li>
                  <li className="flex items-center"><svg className="h-6 w-6 flex-shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg><span className="ml-3 text-sm text-gray-600 dark:text-gray-400">SLA</span></li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-white dark:bg-gray-900/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-center space-x-6">
            <a className="text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary" href="#"><span className="sr-only">Twitter</span><svg aria-hidden="true" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.71v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path></svg></a>
            <a className="text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary" href="#"><span className="sr-only">GitHub</span><svg aria-hidden="true" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.165 6.839 9.49.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.031-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.338 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.001 10.001 0 0022 12c0-5.523-4.477-10-10-10z" fillRule="evenodd"></path></svg></a>
          </div>
          <nav className="mt-8 flex flex-wrap justify-center -mx-5 -my-2">
            <div className="px-5 py-2"><a className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" href="#">Docs</a></div>
            <div className="px-5 py-2"><a className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" href="#">Examples</a></div>
            <div className="px-5 py-2"><a className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" href="#">Pricing</a></div>
            <div className="px-5 py-2"><a className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" href="#">Terms of Service</a></div>
            <div className="px-5 py-2"><a className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" href="#">Privacy Policy</a></div>
          </nav>
          <p className="mt-8 text-center text-sm text-gray-400 dark:text-gray-500">© 2023 QueryBridge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

// pages/index.tsx
import { useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import * as THREE from 'three';

export function LandingPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        // Initialize three.js scene
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            alpha: true,
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Create stars
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.7,
            transparent: true,
        });

        const starsCount = 100;
        const starsPositions = new Float32Array(starsCount * 3);

        for (let i = 0; i < starsCount * 3; i += 3) {
            starsPositions[i] = (Math.random() - 0.5) * 100;
            starsPositions[i + 1] = (Math.random() - 0.5) * 100;
            starsPositions[i + 2] = (Math.random() - 0.5) * 100;
        }

        starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        scene.add(stars);

        // Camera position
        camera.position.z = 20;

        // Handle window resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            stars.rotation.x += 0.0005;
            stars.rotation.y += 0.0005;
            renderer.render(scene, camera);
        };

        animate();

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
        };
    }, []);

    return (
        <>
            <Head>
                <title>AudioVerse | Audio Translation & Key Points</title>
                <meta name="description" content="Translate audio and extract key points with space-age technology" />
                <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            </Head>

            <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10" />

            <div className="font-['Space_Grotesk'] text-white bg-transparent">
                <header className="flex justify-between items-center py-8 fixed absolute z-50 bg-white/30 w-[100%] px-12 ">
                    <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                <line x1="12" y1="19" x2="12" y2="22"></line>
                            </svg>
                        </div>
                        <div className="text-2xl font-bold">
                            Audio<span className="text-purple-500">Verse</span>
                        </div>
                    </div>
                    <nav className="hidden md:block">
                        <ul className="flex space-x-8">
                            <li><a href="#features" className="font-large hover:text-purple-500 transition-colors">Features</a></li>
                            <li><a href="#how-it-works" className="font-xl hover:text-purple-500 transition-colors">How It Works</a></li>
                            <li><a href="#contact" className="font-xl hover:text-purple-500 transition-colors">Contact</a></li>
                        </ul>
                    </nav>
                </header>

                <div className="min-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <section className="flex flex-col md:flex-row items-center justify-between py-24 md:py-32">
                        <div className="max-w-2xl mb-16 md:mb-0 text-center md:text-left">
                            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-purple-500 to-indigo-600 bg-clip-text text-transparent">
                                Translate Audio Across the Universe
                            </h1>
                            <p className="text-lg text-gray-300 mb-10">
                                Upload audio files or record your voice and instantly get accurate translations and key points extraction. Breaking language barriers with space-age technology.
                            </p>
                            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                <a onClick={() => (window.location.href = "/Whisper-with-OpenAI")} className="px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full font-semibold text-white shadow-lg shadow-purple-500/30 hover:-translate-y-1 transition-all">
                                    Try for Free
                                </a>
                                <a href="#how-it-works" className="px-8 py-4 border-2 border-gray-500 rounded-full font-semibold hover:border-purple-500 hover:text-purple-500 transition-all">
                                    How It Works
                                </a>
                            </div>
                        </div>
                        <div className="relative w-80 h-80 md:w-96 md:h-96">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-indigo-600 to-purple-500 rounded-full shadow-lg shadow-purple-500/50 animate-float"></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full border-2 border-white/10 rounded-full animate-spin-slow">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-white to-indigo-600 rounded-lg shadow-lg shadow-white/30"></div>
                            </div>
                        </div>
                    </section>


                    <section id="features" className="py-24">
                        <div className="text-center mb-20">
                            <h2 className="text-4xl font-bold mb-5 bg-gradient-to-r from-white to-purple-500 bg-clip-text text-transparent">
                                Stellar Features
                            </h2>
                            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                                Discover the powerful capabilities that make AudioVerse the ultimate audio translation tool.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:-translate-y-2 hover:shadow-lg hover:shadow-purple-500/20 hover:border-purple-500/30 transition-all">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m5 8 6 6 6-6"></path>
                                        <rect width="20" height="14" x="2" y="5" rx="2"></rect>
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-semibold mb-4">Multi-Format Support</h3>
                                <p className="text-gray-300">
                                    Upload MP3, WAV, or any audio file format. You can also record your voice directly within the app for instant translation.
                                </p>
                            </div>

                            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:-translate-y-2 hover:shadow-lg hover:shadow-purple-500/20 hover:border-purple-500/30 transition-all">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11.5 12H6v-1.5A1.5 1.5 0 0 1 7.5 9h4V4.5A1.5 1.5 0 0 1 13 3h1.5a1.5 1.5 0 0 1 1.5 1.5v4h4.5a1.5 1.5 0 0 1 1.5 1.5V11h-4.5"></path>
                                        <circle cx="8.5" cy="14.5" r="1.5"></circle>
                                        <circle cx="15.5" cy="14.5" r="1.5"></circle>
                                        <path d="M8.5 14.5V17a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-2.5"></path>
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-semibold mb-4">Universal Translation</h3>
                                <p className="text-gray-300">
                                    Translate audio content between 50+ languages with high accuracy. Break down language barriers effortlessly.
                                </p>
                            </div>


                            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:-translate-y-2 hover:shadow-lg hover:shadow-purple-500/20 hover:border-purple-500/30 transition-all">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"></path>
                                        <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"></path>
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-semibold mb-4">Key Points Extraction</h3>
                                <p className="text-gray-300">
                                    Our AI analyzes your audio and automatically generates a summary of key points, saving you time and effort.
                                </p>
                            </div>


                            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:-translate-y-2 hover:shadow-lg hover:shadow-purple-500/20 hover:border-purple-500/30 transition-all">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="3"></circle>
                                        <path d="M3 7V5c0-1.1.9-2 2-2h2"></path>
                                        <path d="M17 3h2c1.1 0 2 .9 2 2v2"></path>
                                        <path d="M21 17v2c0 1.1-.9 2-2 2h-2"></path>
                                        <path d="M7 21H5c-1.1 0-2-.9-2-2v-2"></path>
                                        <circle cx="12" cy="12" r="10"></circle>
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-semibold mb-4">Real-time Processing</h3>
                                <p className="text-gray-300">
                                    Experience lightning-fast results with our advanced AI algorithms that process your audio in seconds.
                                </p>
                            </div>


                            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:-translate-y-2 hover:shadow-lg hover:shadow-purple-500/20 hover:border-purple-500/30 transition-all">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3"></path>
                                        <path d="M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3"></path>
                                        <path d="M4 12h16"></path>
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-semibold mb-4">Cross-Platform Access</h3>
                                <p className="text-gray-300">
                                    Access your translations and key points across all your devices with cloud synchronization.
                                </p>
                            </div>


                            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:-translate-y-2 hover:shadow-lg hover:shadow-purple-500/20 hover:border-purple-500/30 transition-all">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-semibold mb-4">Smart Notifications</h3>
                                <p className="text-gray-300">
                                    Get notified when your audio processing is complete and access your translations instantly.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* How It Works Section */}
                    <section id="how-it-works" className="py-24">
                        <div className="text-center mb-20">
                            <h2 className="text-4xl font-bold mb-5 bg-gradient-to-r from-white to-purple-500 bg-clip-text text-transparent">
                                How It Works
                            </h2>
                            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                                Three simple steps to translate audio and extract key points with AudioVerse.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            {/* Step 1 */}
                            <div className="text-center relative">
                                <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
                                    <span className="text-2xl font-bold">1</span>
                                </div>
                                <h3 className="text-2xl font-semibold mb-4">Upload or Record</h3>
                                <p className="text-gray-300">
                                    Upload any audio file or record your voice directly within the app.
                                </p>
                                <div className="hidden md:block absolute top-10 left-[60%] w-full h-0.5 bg-gradient-to-r from-purple-500/0 via-purple-500 to-purple-500/0 z-0"></div>
                            </div>

                            {/* Step 2 */}
                            <div className="text-center relative">
                                <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
                                    <span className="text-2xl font-bold">2</span>
                                </div>
                                <h3 className="text-2xl font-semibold mb-4">AI Processing</h3>
                                <p className="text-gray-300">
                                    Our advanced AI analyzes your audio and processes it in seconds.
                                </p>
                                <div className="hidden md:block absolute top-10 left-[60%] w-full h-0.5 bg-gradient-to-r from-purple-500/0 via-purple-500 to-purple-500/0 z-0"></div>
                            </div>

                            {/* Step 3 */}
                            <div className="text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <span className="text-2xl font-bold">3</span>
                                </div>
                                <h3 className="text-2xl font-semibold mb-4">Get Results</h3>
                                <p className="text-gray-300">
                                    Receive accurate translations and key points extracted from your audio.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* CTA Section */}
                    <section className="py-24 my-12 text-center rounded-3xl bg-gradient-to-b from-indigo-900/40 to-purple-900/40 backdrop-blur-sm border border-white/5">
                        <div className="max-w-3xl mx-auto px-6">
                            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-purple-500 bg-clip-text text-transparent">
                                Ready to Break Language Barriers?
                            </h2>
                            <p className="text-lg text-gray-300 mb-10">
                                Join thousands of users who are already using AudioVerse to translate audio and extract key points with ease.
                            </p>
                            <a href="#" className="px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full font-semibold text-white shadow-lg shadow-purple-500/30 hover:-translate-y-1 transition-all inline-block">
                                Get Started for Free
                            </a>
                        </div>
                    </section>

                    {/* Footer */}
                    <footer className="py-16">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                            {/* About */}
                            <div>
                                <div className="flex items-center mb-6">
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                            <line x1="12" y1="19" x2="12" y2="22"></line>
                                        </svg>
                                    </div>
                                    <div className="text-2xl font-bold">
                                        Audio<span className="text-purple-500">Verse</span>
                                    </div>
                                </div>
                                <p className="text-gray-300 mb-6">
                                    Translating audio and extracting key points with space-age technology. Breaking language barriers across the universe.
                                </p>
                                <div className="flex space-x-4">
                                    <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-purple-500 hover:-translate-y-1 transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                                        </svg>
                                    </a>
                                    <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-purple-500 hover:-translate-y-1 transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                                        </svg>
                                    </a>
                                    <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-purple-500 hover:-translate-y-1 transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                                        </svg>
                                    </a>
                                </div>
                            </div>

                            {/* Product Links */}
                            <div>
                                <h3 className="text-xl font-semibold mb-6">Product</h3>
                                <ul className="space-y-3">
                                    <li><a href="#" className="text-gray-300 hover:text-purple-500 transition-colors">Features</a></li>
                                    <li><a href="#" className="text-gray-300 hover:text-purple-500 transition-colors">Pricing</a></li>
                                    <li><a href="#" className="text-gray-300 hover:text-purple-500 transition-colors">API Access</a></li>
                                    <li><a href="#" className="text-gray-300 hover:text-purple-500 transition-colors">Integrations</a></li>
                                </ul>
                            </div>

                            {/* Resources Links */}
                            <div>
                                <h3 className="text-xl font-semibold mb-6">Resources</h3>
                                <ul className="space-y-3">
                                    <li><a href="#" className="text-gray-300 hover:text-purple-500 transition-colors">Documentation</a></li>
                                    <li><a href="#" className="text-gray-300 hover:text-purple-500 transition-colors">Blog</a></li>
                                    <li><a href="#" className="text-gray-300 hover:text-purple-500 transition-colors">Tutorials</a></li>
                                    <li><a href="#" className="text-gray-300 hover:text-purple-500 transition-colors">Support</a></li>
                                </ul>
                            </div>

                            {/* Company Links */}
                            <div>
                                <h3 className="text-xl font-semibold mb-6">Company</h3>
                                <ul className="space-y-3">
                                    <li><a href="#" className="text-gray-300 hover:text-purple-500 transition-colors">About Us</a></li>
                                    <li><a href="#" className="text-gray-300 hover:text-purple-500 transition-colors">Careers</a></li>
                                    <li><a href="#" className="text-gray-300 hover:text-purple-500 transition-colors">Contact</a></li>
                                    <li><a href="#" className="text-gray-300 hover:text-purple-500 transition-colors">Privacy Policy</a></li>
                                </ul>
                            </div>
                        </div>

                        <div className="text-center pt-8 border-t border-white/10 text-gray-400">
                            <p>&copy; {new Date().getFullYear()} AudioVerse. All rights reserved.</p>
                        </div>
                    </footer>
                </div>
            </div>
        </>
    );
}

export default LandingPage
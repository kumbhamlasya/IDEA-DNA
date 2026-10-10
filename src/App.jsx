import React, { useEffect, useRef, useState } from "react";
import "./App.css";

// On Vercel the frontend and API share the same domain, so use relative paths.
// For local dev, set VITE_API_URL=http://localhost:5000 in a .env.local file.
const apiBase = import.meta.env.VITE_API_URL ?? "";
const processStages = [
	"Extracting concept DNA",
	"Finding hidden connections",
	"Discovering the problem",
	"Generating innovation",
	"Finalizing the idea"
];

async function postJson(path, body = {}) {
	const response = await fetch(`${apiBase}${path}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body)
	});
	const data = await response.json().catch(() => ({}));
	if (!response.ok) throw new Error(data.error || "AI generation failed. Please try again.");
	return data;
}

function errorMessage(error) {
	if (error instanceof TypeError || /fetch failed|networkerror/i.test(error.message || "")) {
		return "AI engine unavailable. Make sure the backend is running on port 5000.";
	}
	return error.message || "AI generation failed. Please try again.";
}

function App() {
	const [words, setWords] = useState(["Agriculture", "Spotify", "Uber"]);
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState(null);
	const [error, setError] = useState("");
	const [mutationLoading, setMutationLoading] = useState(false);
	const [mutation, setMutation] = useState(null);
	const [randomLoading, setRandomLoading] = useState(false);
	const [showResults, setShowResults] = useState(false);
	const [isJudgeChallenge, setIsJudgeChallenge] = useState(false);
	const [stageIndex, setStageIndex] = useState(0);
	const [miroNotice, setMiroNotice] = useState("");
	const inputRefs = useRef([]);

	useEffect(() => {
		if (!loading) return undefined;
		setStageIndex(0);
		const timer = window.setInterval(() => {
			setStageIndex((current) => Math.min(current + 1, processStages.length - 1));
		}, 850);
		return () => window.clearInterval(timer);
	}, [loading]);

	function updateWord(index, value) {
		setWords((current) => current.map((word, wordIndex) => (
			wordIndex === index ? value : word
		)));
	}

	function handleInputKeyDown(event, index) {
		if (event.key !== "Enter") return;
		event.preventDefault();
		if (index < 2) inputRefs.current[index + 1]?.focus();
		else generateIdea();
	}

	async function generateIdea(event) {
		event?.preventDefault();
		const cleanWords = words.map((word) => word.trim());
		if (cleanWords.length !== 3 || cleanWords.some((word) => !word)) {
			setError("Please enter exactly 3 concepts.");
			return;
		}

		setLoading(true);
		setError("");
		setMiroNotice("");
		setMutation(null);
		try {
			const data = await postJson("/api/generate", { words: cleanWords });
			setResult(data);
			setShowResults(true);
			window.setTimeout(() => {
				document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
			}, 50);
		} catch (requestError) {
			setError(errorMessage(requestError));
		} finally {
			setLoading(false);
		}
	}

	async function randomChallenge() {
		setRandomLoading(true);
		setError("");
		setMiroNotice("");
		try {
			const data = await postJson("/api/random");
			setWords(data.words);
			setIsJudgeChallenge(true);
			setResult(null);
			setMutation(null);
			setShowResults(false);
		} catch (requestError) {
			setError(errorMessage(requestError));
		} finally {
			setRandomLoading(false);
		}
	}

	async function mutateIdea() {
		if (!result?.innovation) return;
		setMutationLoading(true);
		setError("");
		setMiroNotice("");
		try {
			const data = await postJson("/api/mutate", {
				originalIdea: result.innovation,
				words: words.map((word) => word.trim())
			});
			setMutation(data);
		} catch (requestError) {
			setError(errorMessage(requestError));
		} finally {
			setMutationLoading(false);
		}
	}

	async function prepareMiroMap() {
		setMiroNotice("");
		setError("");
		try {
			const data = await postJson("/api/miro", {
				words: words.map((word) => word.trim()),
				result,
				mutation
			});
			setMiroNotice(`${data.message} No board was created because Miro integration is not configured.`);
		} catch (requestError) {
			setError(errorMessage(requestError));
		}
	}

	function tryAnother() {
		setResult(null);
		setMutation(null);
		setError("");
		setMiroNotice("");
		setShowResults(false);
		window.setTimeout(() => {
			document.getElementById("challenge")?.scrollIntoView({ behavior: "smooth", block: "start" });
			inputRefs.current[0]?.focus();
		}, 50);
	}

	return (
		<div className="app-shell">
			<div className="background-grid" aria-hidden="true" />
			<header className="topbar" id="top">
				<a className="brand" href="#top" aria-label="IDEA DNA home">
					<span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
					<span>IDEA <b>DNA</b></span>
				</a>
				<div className="topbar-meta">
					<span className="live-dot" />
					<span>INNOVATION LAB</span>
					<span className="meta-divider">/</span>
					<span>LOCAL SESSION</span>
				</div>
				<a className="topbar-link" href="#challenge">OPEN WORKBENCH <span aria-hidden="true">↘</span></a>
			</header>

			<main>
				<section className="hero-section" aria-labelledby="page-title">
					<div className="hero-copy">
						<p className="eyebrow"><span>01</span> CONCEPT COLLISION ENGINE</p>
						<h1 id="page-title">IDEA <em>DNA</em></h1>
						<p className="tagline">Three unrelated ideas.<br /><strong>One unexpected innovation.</strong></p>
						<p className="hero-note">Extract the principle. Find the friction. Build what neither idea could become alone.</p>
					</div>

					<div className="collision-map" aria-label="Three concepts converge into one innovation">
						<div className="map-label">COLLISION MAP <span>01—03</span></div>
						<div className="map-flow">
							<div className="map-inputs">
								<span><b>01</b> CONCEPT</span>
								<span><b>02</b> CONCEPT</span>
								<span><b>03</b> CONCEPT</span>
							</div>
							<div className="map-merge" aria-hidden="true"><i /><i /><i /></div>
							<div className="map-output"><span className="output-spark">✳</span><span>NEW POSSIBILITY</span></div>
						</div>
						<div className="map-foot"><span>TRANSFERABLE PRINCIPLES</span><span>NOT LITERAL OBJECTS</span></div>
					</div>
				</section>

				<section className="workbench" id="challenge" aria-labelledby="workbench-title">
					<div className="workbench-heading">
						<div>
							<p className="eyebrow"><span>INPUT / 03</span> START WITH A CONTRADICTION</p>
							<h2 id="workbench-title">Set the ingredients.</h2>
						</div>
						{isJudgeChallenge && <span className="judge-tag"><span>✳</span> JUDGE CHALLENGE</span>}
					</div>

					<div className="workbench-grid">
						<form className="concept-form" onSubmit={generateIdea}>
							<div className="concept-list">
								{words.map((word, index) => (
									<label className={`concept-input concept-input-${index + 1}`} key={index}>
										<span className="concept-number">0{index + 1}</span>
										<span className="concept-name">CONCEPT {String(index + 1).padStart(2, "0")}</span>
										<input
											ref={(element) => { inputRefs.current[index] = element; }}
											value={word}
											onChange={(event) => updateWord(index, event.target.value)}
											onKeyDown={(event) => handleInputKeyDown(event, index)}
											maxLength={80}
											aria-label={`Concept ${index + 1}`}
											placeholder={`Enter concept ${index + 1}`}
											autoComplete="off"
										/>
										<span className="input-indicator" aria-hidden="true">↗</span>
									</label>
								))}
							</div>

							<div className="form-actions">
								<button className="button button-primary" type="submit" disabled={loading || randomLoading}>
									<span className="button-icon" aria-hidden="true">✳</span>
									{loading ? "GENERATING" : "GENERATE IDEA"}
									<span className="button-arrow" aria-hidden="true">↗</span>
								</button>
								<button className="button button-secondary" type="button" onClick={randomChallenge} disabled={loading || randomLoading}>
									<span className="button-icon" aria-hidden="true">⤨</span>
									{randomLoading ? "SHUFFLING" : "RANDOM CHALLENGE"}
								</button>
							</div>

							{error && <p className="error-message" role="alert"><span aria-hidden="true">!</span>{error}</p>}
						</form>

						<aside className={`process-panel ${loading ? "is-processing" : ""}`} aria-live="polite">
							<div className="panel-topline">
								<span>{loading ? "RUNNING ANALYSIS" : "SYSTEM / READY"}</span>
								<span className="panel-index">{loading ? `0${stageIndex + 1} / 05` : "DNA—01"}</span>
							</div>
							{loading ? (
								<ol className="process-list">
									{processStages.map((stage, index) => (
										<li className={index < stageIndex ? "is-done" : index === stageIndex ? "is-active" : ""} key={stage}>
											<span className="process-icon" aria-hidden="true">{["⌘", "↗", "!", "✳", "✓"][index]}</span>
											<span>{stage}<span className="process-ellipsis">...</span></span>
											<span className="process-state">{index < stageIndex ? "DONE" : index === stageIndex ? "NOW" : ""}</span>
										</li>
									))}
								</ol>
							) : (
								<div className="idle-panel-content">
									<div className="idle-orbit" aria-hidden="true"><span>01</span><span>02</span><span>03</span><b>DNA</b></div>
									<div>
										<p className="idle-title">Ready to cross-pollinate.</p>
										<p className="idle-copy">Three inputs go in. A different way to see the problem comes out.</p>
									</div>
									  <div className="panel-bottomline"><span>MODEL: QWEN 3.8 27B FREE / OPENROUTER</span><span>KEY: SERVER-SIDE</span></div>
								</div>
							)}
							<div className="scan-line" aria-hidden="true" />
						</aside>
					</div>
				</section>

				{showResults && result && (
					<section className="results-section" id="results" aria-labelledby="results-title">
						<div className="results-heading">
							<div>
								<p className="eyebrow"><span>OUTPUT / 01</span> SYNTHESIS COMPLETE</p>
								<h2 id="results-title">The signal in the noise.</h2>
							</div>
							<span className="result-stamp"><span className="live-dot" /> GENERATED / QWEN</span>
						</div>

						<div className="dna-section">
							<div className="section-label"><span>✳</span> THE DNA <small>TRANSFERABLE PRINCIPLES</small></div>
							<div className="dna-grid">
								{(result.dna || []).map((item, index) => (
									<article className={`dna-card dna-card-${index + 1}`} key={`${item.input}-${index}`}>
										<div className="dna-card-top"><span>CONCEPT 0{index + 1}</span><span className="dna-card-mark">↗</span></div>
										<h3>{item.input}</h3>
										<p className="dna-characteristic">{item.core_characteristic}</p>
										{item.transferable_principle && <p className="dna-principle">{item.transferable_principle}</p>}
									</article>
								))}
							</div>
						</div>

						<div className="insight-grid">
							<article className="insight-block connection-block">
								<div className="section-label"><span>↗</span> HIDDEN CONNECTION</div>
								<p>{result.connection}</p>
							</article>
							<article className="insight-block problem-block">
								<div className="section-label"><span>!</span> THE PROBLEM</div>
								<p>{result.problem}</p>
							</article>
						</div>

						<article className="innovation-feature">
							<div className="innovation-kicker"><span>CORE OUTPUT / 01</span><span>✳ CONCEPT SYNTHESIS</span></div>
							<div className="innovation-title-row">
								<div className="innovation-marker" aria-hidden="true">✳</div>
								<div>
									<div className="section-label">THE INNOVATION</div>
									<h3>{result.innovation}</h3>
								</div>
							</div>
							<div className="innovation-foot"><span>BUILT FROM {words.map((word) => word.trim().toUpperCase()).join("  ×  ")}</span><span>GENERATION 01</span></div>
						</article>

						<div className="audience-grid">
							<article className="insight-block audience-block">
								<div className="section-label"><span>◎</span> TARGET USERS</div>
								<p>{result.target_users}</p>
							</article>
							<article className="insight-block feature-block">
								<div className="section-label"><span>✦</span> UNEXPECTED FEATURE</div>
								<p>{result.unexpected_feature}</p>
							</article>
						</div>

						<div className="result-actions">
							<button className="button button-primary" type="button" onClick={mutateIdea} disabled={mutationLoading}>
								<span className="button-icon" aria-hidden="true">⤨</span>
								{mutationLoading ? "MUTATING IDEA" : "MUTATE IDEA"}
								<span className="button-arrow" aria-hidden="true">↗</span>
							</button>
							<button className="button button-secondary" type="button" onClick={prepareMiroMap}>
								<span className="button-icon" aria-hidden="true">▤</span> SEND TO MIRO
							</button>
							<button className="button button-quiet" type="button" onClick={tryAnother}>
								<span aria-hidden="true">↻</span> TRY ANOTHER
							</button>
						</div>

						{miroNotice && <p className="miro-notice" role="status"><span aria-hidden="true">▤</span>{miroNotice}</p>}
						{error && <p className="error-message result-error" role="alert"><span aria-hidden="true">!</span>{error}</p>}

						{mutation && (
							<section className="mutation-section" aria-labelledby="mutation-title">
								<div className="mutation-heading">
									<div>
										<p className="eyebrow"><span>EVOLUTION / 02</span> ASSUMPTION TEST</p>
										<h2 id="mutation-title">An idea under pressure.</h2>
									</div>
									<span className="mutation-glyph" aria-hidden="true">⤨</span>
								</div>
								<div className="generation-flow">
									<article className="generation-card generation-one">
										<div className="generation-label"><span>GENERATION 01</span><span>BASELINE</span></div>
										<p>{result.innovation}</p>
									</article>
									<div className="generation-transition" aria-hidden="true"><span>↓</span><small>ONE ASSUMPTION CHANGED</small></div>
									<article className="generation-card generation-two">
										<div className="generation-label"><span>GENERATION 02</span><span>EVOLVED</span></div>
										<p>{mutation.evolved_innovation}</p>
									</article>
								</div>
								<div className="mutation-details">
									<article><div className="section-label">CHANGED ASSUMPTION</div><p>{mutation.changed_assumption}</p></article>
									<article><div className="section-label">MUTATION</div><p>{mutation.mutation}</p></article>
									<article><div className="section-label">WHY IT IS DIFFERENT</div><p>{mutation.why_it_is_different}</p></article>
								</div>
							</section>
						)}
					</section>
				)}
			</main>

			<footer className="footer">
				<a className="brand footer-brand" href="#top"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>IDEA <b>DNA</b></span></a>
				<span>THINK IN PRINCIPLES. BUILD THE UNEXPECTED.</span>
				<a href="#top" className="back-top">BACK TO TOP ↑</a>
			</footer>
		</div>
	);
}

export default App;


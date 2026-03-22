import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import ScrollFloat from './ScrollFloat';
import GlareHover from './GlareHover';
import Particles from './Particles'; // Import the new Particles component
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const PROJECT_SUBMISSION_TABLE_CANDIDATES = ['project_submissions', 'project_submission'] as const;

const isMissingProjectSubmissionTableError = (error: any) => {
  const message = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase();
  return (
    error?.code === '42P01' ||
    message.includes('could not find the table') ||
    message.includes('schema cache') ||
    message.includes('relation') && message.includes('does not exist')
  );
};

const isProjectSubmissionSchemaIssue = (error: any) => {
  const message = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase();
  return error?.code === '42703' || message.includes('column') || message.includes('does not exist');
};

const AIProjects: React.FC = () => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);
  const [gradientActive, setGradientActive] = React.useState(false);
  const [projectUploadFile, setProjectUploadFile] = React.useState<File | null>(null);
  const [isSubmittingProject, setIsSubmittingProject] = React.useState(false);
  const [projectSubmitNotice, setProjectSubmitNotice] = React.useState('');
  const [projectForm, setProjectForm] = React.useState({
    fullName: '',
    email: '',
    contactNumber: '',
    projectName: '',
    projectLink: '',
    resourceLink: '',
    mainAiNeed: 'Data Collection',
    description: '',
  });
  const ideaBoardRows = [
    {
      project: "Voice AI for Rural Banking",
      problem: "Customers struggle with text-heavy mobile apps in low-connectivity regions.",
      aiApproach: "Multilingual speech agent + lightweight on-device intent classification.",
      impact: "Faster onboarding and inclusive access to financial services.",
      owner: "Product + NLP Team"
    },
    {
      project: "Archive Intelligence Studio",
      problem: "Historical records are difficult to search due to inconsistent formats.",
      aiApproach: "Document OCR pipeline + entity extraction + confidence-based validation loop.",
      impact: "Searchable, structured archives for researchers and institutions.",
      owner: "Data Ops Team"
    },
    {
      project: "Visual Defect Radar",
      problem: "Manual quality checks miss subtle defects in high-volume manufacturing.",
      aiApproach: "Computer vision anomaly detection with human-in-the-loop review dashboard.",
      impact: "Improved quality control and reduced inspection cost per unit.",
      owner: "CV Team"
    }
  ];
  const submissionRows = [
    { name: "Customer Assist Copilot", link: "https://assist-demo.example.com", stage: "Live", focus: "NLP" },
    { name: "AI Archive Scanner", link: "https://archive-lab.example.org", stage: "Beta", focus: "OCR + Search" },
    { name: "Defect Vision Monitor", link: "https://vision-preview.example.io", stage: "Prototype", focus: "Computer Vision" },
  ];

  const projectImages = [
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop", // 2.1
    "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=2070&auto=format&fit=crop", // 2.2
    "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2070&auto=format&fit=crop", // 2.3
    "https://images.unsplash.com/photo-1549923746-c502d488b3ea?q=80&w=2071&auto=format&fit=crop", // 2.4
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop", // 2.5
    "https://framerusercontent.com/images/RIqv6T7aFrp5Q9X85Zqy55KQ8x4.png?scale-down-to=2048&width=1856&height=2464", // 2.6
    "https://framerusercontent.com/images/ad17haYjwUpqxpqARkBZaMKSqmM.png?scale-down-to=1024&width=1856&height=2464", // 2.7
  ];

  React.useEffect(() => {
    setProjectForm((prev) => ({
      ...prev,
      fullName: prev.fullName || (profile?.full_name || '').toString(),
      email: prev.email || (user?.email || profile?.email || '').toString(),
      contactNumber: prev.contactNumber || (profile?.phone || '').toString(),
    }));
  }, [profile?.full_name, profile?.email, profile?.phone, user?.email]);

  const handleProjectFormChange = (
    field: keyof typeof projectForm,
    value: string
  ) => {
    setProjectForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitProject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const fullName = projectForm.fullName.trim();
    const email = projectForm.email.trim().toLowerCase();
    const contactNumber = projectForm.contactNumber.trim();
    const projectName = projectForm.projectName.trim();
    const projectLink = projectForm.projectLink.trim();
    const resourceLink = projectForm.resourceLink.trim();
    const mainAiNeed = projectForm.mainAiNeed.trim();
    const description = projectForm.description.trim();

    if (!fullName || !email || !contactNumber || !projectName || !description || !mainAiNeed) {
      setProjectSubmitNotice('Please complete Full Name, Email, Contact Number, Project Name, Main AI Need, and Description.');
      return;
    }

    setIsSubmittingProject(true);
    setProjectSubmitNotice('');

    const payload = {
      user_id: user?.id || null,
      full_name: fullName,
      email,
      contact_number: contactNumber,
      project_name: projectName,
      description,
      project_link: projectLink || null,
      resource_link: resourceLink || null,
      uploaded_file_name: projectUploadFile?.name || null,
      main_ai_need: mainAiNeed,
      status: 'pending',
    };

    const payloadVariants: Array<Record<string, string | null>> = [
      payload,
      {
        user_id: user?.id || null,
        full_name: fullName,
        email,
        contact_number: contactNumber,
        project_name: projectName,
        description,
        project_link: projectLink || null,
        resource_link: resourceLink || null,
        main_ai_need: mainAiNeed,
        status: 'pending',
      },
      {
        full_name: fullName,
        email,
        contact_number: contactNumber,
        project_name: projectName,
        description,
        project_link: projectLink || null,
        resource_link: resourceLink || null,
        status: 'pending',
      },
    ];

    let error: { code?: string; message: string; details?: string | null } | null = null;
    let projectSubmissionSaved = false;
    let usedSubmissionTable: (typeof PROJECT_SUBMISSION_TABLE_CANDIDATES)[number] | null = null;

    for (const submissionTable of PROJECT_SUBMISSION_TABLE_CANDIDATES) {
      for (const candidatePayload of payloadVariants) {
        const { error: insertError } = await supabase
          .from(submissionTable)
          .insert([candidatePayload]);

        if (!insertError) {
          projectSubmissionSaved = true;
          usedSubmissionTable = submissionTable;
          error = null;
          break;
        }

        error = insertError;

        if (isMissingProjectSubmissionTableError(insertError)) {
          // Try the next candidate table name.
          break;
        }

        if (!isProjectSubmissionSchemaIssue(insertError)) {
          // Non-schema error should stop retries.
          break;
        }
      }

      if (projectSubmissionSaved) break;
      if (error && !isMissingProjectSubmissionTableError(error)) break;
    }

    if (error || !projectSubmissionSaved) {
      console.error('Error submitting project:', error);
      if (error && isMissingProjectSubmissionTableError(error)) {
        setProjectSubmitNotice('Project submission table is missing in Supabase. Please run section 4 in supabase_setup.sql.');
      } else {
        const safeMessage = error?.message ? ` (${error.message})` : '';
        setProjectSubmitNotice(`Unable to submit project right now. Please try again.${safeMessage}`);
      }
      setIsSubmittingProject(false);
      return;
    }

    setProjectForm((prev) => ({
      ...prev,
      projectName: '',
      projectLink: '',
      resourceLink: '',
      mainAiNeed: 'Data Collection',
      description: '',
    }));
    setProjectUploadFile(null);
    if (usedSubmissionTable === 'project_submission') {
      setProjectSubmitNotice('Project submitted successfully (using legacy project_submission table).');
    } else {
      setProjectSubmitNotice('Project submitted successfully.');
    }
    setIsSubmittingProject(false);
  };

  return (
    <div className={`relative min-h-screen pt-40 pb-20 px-8 md:px-20 z-10 transition-colors duration-1000 ${gradientActive ? 'bg-gradient-to-br from-yellow-50 via-orange-50 to-green-50' : 'bg-white'}`}>
      <Particles 
        className="absolute inset-0 -z-10"
        particleCount={300}
        particleColors={['var(--color-lw-green)', '#FFB347', '#FFFF00']}
        speed={0.05}
        particleBaseSize={120} // Increased base size
        alphaParticles={true}
        cameraDistance={15}
        onTripleClick={() => setGradientActive(true)}
      />
      <div className="max-w-7xl mx-auto">
        {/* Decorative Top Element */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-4 h-4 rounded-full bg-black"></div>
          <div className="w-4 h-4 rounded-full border border-black bg-white"></div>
          <div className="h-[1px] w-24 border-t border-dashed border-black ml-1"></div>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-bold text-black mb-10 tracking-tight">
          {t('aiProjectsPage.title')}
        </h1>
        
        <p className="text-[#333] text-lg md:text-xl max-w-5xl leading-relaxed mb-12">
          {t('aiProjectsPage.description')}
        </p>

        <div className="flex items-center gap-3">
          <button className="px-8 py-3 bg-[#FFB347] text-black font-semibold rounded-full hover:bg-[#FFA500] transition-colors">
            {t('nav.contactUs')}
          </button>
          <button className="w-10 h-10 rounded-full bg-[#004D40] flex items-center justify-center text-white hover:bg-[#00332C] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="17" x2="17" y2="7"></line>
              <polyline points="7 7 17 7 17 17"></polyline>
            </svg>
          </button>
        </div>

        {/* Second Section: What we currently handle */}
        <div className="mt-32">
          <div className="flex flex-col items-center mb-16">
            <span className="px-4 py-1 bg-black text-white text-xs font-bold rounded-full mb-4 uppercase tracking-widest">
              Projects
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-black text-center">
              What we currently handle
            </h2>
          </div>

          <div className="flex flex-col lg:flex-row gap-12 items-start">
            {/* Left side: Image */}
            <div className="lg:w-1/2 w-full">
              <div className="sticky top-32">
                <GlareHover 
                  borderRadius="2rem" 
                  glareOpacity={0.4} 
                  className="shadow-2xl"
                >
                  <img 
                    src={openIndex !== null ? projectImages[openIndex] : projectImages[0]} 
                    alt="AI Project Illustration" 
                    className="w-full aspect-[4/5] object-cover transition-all duration-700 ease-in-out"
                    referrerPolicy="no-referrer"
                  />
                </GlareHover>
              </div>
            </div>

            {/* Right side: Accordion */}
            <div className="lg:w-1/2 w-full">
              <ProjectAccordion openIndex={openIndex} setOpenIndex={setOpenIndex} />
            </div>
          </div>
        </div>

        {/* Third Section: Share Your Projects */} 
        <div className="mt-32">
          <div className="rounded-[2.25rem] border border-black/10 bg-gradient-to-br from-[#f9fff5] via-[#fff7eb] to-[#f2fffb] p-8 md:p-12 shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-10">
              <div className="max-w-3xl">
                <span className="inline-flex items-center gap-2 px-4 py-1 bg-black text-white text-xs font-bold rounded-full uppercase tracking-widest mb-4">
                  Share Your Projects
                </span>
                <h2 className="text-4xl md:text-5xl font-bold text-black leading-tight mb-5">
                  Turn your AI concept into a project roadmap.
                </h2>
                <p className="text-[#2f2f2f] text-base md:text-lg leading-relaxed">
                  Bring your raw idea, half-formed notes, or full proposal. This section helps teams align on the core challenge, AI method, expected outcome, and ownership before execution starts.
                </p>
              </div>
              <div className="lg:max-w-xs">
                <div className="rounded-2xl bg-black text-white px-6 py-5">
                  <p className="text-xs uppercase tracking-widest text-white/70 mb-2">Creative Prompt</p>
                  <p className="text-sm leading-relaxed">
                    If your project succeeds in 90 days, what experience becomes easier for real people?
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-black/15 bg-white/90 overflow-hidden">
              <div className="px-6 py-4 border-b border-black/10 bg-white">
                <h3 className="text-lg md:text-xl font-bold text-black">Project Idea Board</h3>
                <p className="text-sm text-black/65 mt-1">
                  Use this frame to present ideas clearly and compare initiatives side by side.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] border-collapse">
                  <thead>
                    <tr className="bg-[#f6f6f6] text-left">
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider border-b border-r border-black/10">Project Idea</th>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider border-b border-r border-black/10">Problem To Solve</th>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider border-b border-r border-black/10">AI Approach</th>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider border-b border-r border-black/10">Expected Impact</th>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider border-b border-black/10">Team Owner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ideaBoardRows.map((row, index) => (
                      <tr key={row.project} className={index % 2 === 0 ? 'bg-white' : 'bg-[#fcfcfc]'}>
                        <td className="px-5 py-4 align-top border-b border-r border-black/10 text-sm font-semibold text-black">{row.project}</td>
                        <td className="px-5 py-4 align-top border-b border-r border-black/10 text-sm text-black/80 leading-relaxed">{row.problem}</td>
                        <td className="px-5 py-4 align-top border-b border-r border-black/10 text-sm text-black/80 leading-relaxed">{row.aiApproach}</td>
                        <td className="px-5 py-4 align-top border-b border-r border-black/10 text-sm text-black/80 leading-relaxed">{row.impact}</td>
                        <td className="px-5 py-4 align-top border-b border-black/10 text-sm text-black/80">{row.owner}</td>
                      </tr>
                    ))}
                    <tr className="bg-[#fffef8]">
                      <td className="px-5 py-5 align-top border-b border-r border-black/10 text-sm text-black/50 italic">Your next idea...</td>
                      <td className="px-5 py-5 align-top border-b border-r border-black/10 text-sm text-black/50 italic">Describe the challenge.</td>
                      <td className="px-5 py-5 align-top border-b border-r border-black/10 text-sm text-black/50 italic">Outline your AI method.</td>
                      <td className="px-5 py-5 align-top border-b border-r border-black/10 text-sm text-black/50 italic">Define measurable value.</td>
                      <td className="px-5 py-5 align-top border-b border-black/10 text-sm text-black/50 italic">Assign ownership.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Fifth Section: Submit Your Project */} 
        <div className="mt-32">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-black/10 bg-[linear-gradient(145deg,#081220_0%,#0e1f38_55%,#17345f_100%)] p-8 md:p-12 shadow-[0_30px_70px_rgba(2,6,23,0.4)]">
            <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />
            <div className="absolute -bottom-20 right-8 h-72 w-72 rounded-full bg-sky-300/10 blur-3xl" />

            <div className="relative z-10 mb-10">
              <span className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/15 text-white text-xs font-bold uppercase tracking-widest mb-4">
                <span>005</span>
                <span>Project Submission Hub</span>
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                Send your idea, website, or deployed app.
              </h2>
              <p className="text-white/75 text-base md:text-lg max-w-3xl leading-relaxed">
                Share your project through this section. Paste your live link or prototype URL, describe your goal, and we will help design the right AI data and model strategy.
              </p>
            </div>

            <div className="relative z-10 grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              <div className="xl:col-span-7">
                <div className="rounded-[2rem] bg-white p-6 md:p-8 border border-black/10">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-black">Submit Your Project</h3>
                    <p className="text-sm text-black/60 mt-1">We review submissions and reply with a discovery plan.</p>
                  </div>

                  <form onSubmit={handleSubmitProject} encType="multipart/form-data" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wider text-black/60">Full Name</span>
                      <input
                        type="text"
                        value={projectForm.fullName}
                        onChange={(e) => handleProjectFormChange('fullName', e.target.value)}
                        placeholder="Your full name"
                        className="mt-2 w-full rounded-xl border border-black/15 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-lw-green/40"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wider text-black/60">Project Name</span>
                      <input
                        type="text"
                        value={projectForm.projectName}
                        onChange={(e) => handleProjectFormChange('projectName', e.target.value)}
                        placeholder="Example: Smart Ops Assistant"
                        className="mt-2 w-full rounded-xl border border-black/15 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-lw-green/40"
                      />
                    </label>
                    <label className="block md:col-span-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-black/60">Email</span>
                      <input
                        type="email"
                        value={projectForm.email}
                        onChange={(e) => handleProjectFormChange('email', e.target.value)}
                        placeholder="you@gmail.com"
                        className="mt-2 w-full rounded-xl border border-black/15 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-lw-green/40"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wider text-black/60">Main AI Need</span>
                      <select
                        value={projectForm.mainAiNeed}
                        onChange={(e) => handleProjectFormChange('mainAiNeed', e.target.value)}
                        className="mt-2 w-full rounded-xl border border-black/15 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-lw-green/40"
                      >
                        <option>Data Collection</option>
                        <option>Annotation</option>
                        <option>NLP / Speech</option>
                        <option>Computer Vision</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wider text-black/60">Contact Number</span>
                      <input
                        type="text"
                        value={projectForm.contactNumber}
                        onChange={(e) => handleProjectFormChange('contactNumber', e.target.value)}
                        placeholder="+63..."
                        className="mt-2 w-full rounded-xl border border-black/15 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-lw-green/40"
                      />
                    </label>
                    <label className="block md:col-span-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-black/60">Project Link (Web / App / Demo)</span>
                      <input
                        type="url"
                        value={projectForm.projectLink}
                        onChange={(e) => handleProjectFormChange('projectLink', e.target.value)}
                        placeholder="https://yourapp.com"
                        className="mt-2 w-full rounded-xl border border-black/15 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-lw-green/40"
                      />
                    </label>
                    <label className="block md:col-span-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-black/60">Video / File Link (Drive, YouTube, Dropbox)</span>
                      <input
                        type="url"
                        value={projectForm.resourceLink}
                        onChange={(e) => handleProjectFormChange('resourceLink', e.target.value)}
                        placeholder="https://drive.google.com/... or https://youtube.com/..."
                        className="mt-2 w-full rounded-xl border border-black/15 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-lw-green/40"
                      />
                    </label>
                    <label className="block md:col-span-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-black/60">Upload Video or File</span>
                      <div className="mt-2 rounded-xl border border-dashed border-black/20 bg-black/[0.02] px-4 py-3">
                        <input
                          type="file"
                          accept="video/*,.pdf,.doc,.docx,.ppt,.pptx,.zip"
                          onChange={(e) => setProjectUploadFile(e.target.files?.[0] || null)}
                          className="w-full text-sm text-black/75 file:mr-4 file:rounded-full file:border-0 file:bg-black file:px-4 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-black/85"
                        />
                        <p className="mt-2 text-xs text-black/50">Accepted formats: MP4, MOV, PDF, DOC, PPT, ZIP.</p>
                      </div>
                    </label>
                    <label className="block md:col-span-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-black/60">Idea Summary</span>
                      <textarea
                        rows={4}
                        value={projectForm.description}
                        onChange={(e) => handleProjectFormChange('description', e.target.value)}
                        placeholder="What problem are you solving and what result do you want?"
                        className="mt-2 w-full rounded-xl border border-black/15 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-lw-green/40"
                      />
                    </label>
                    <div className="md:col-span-2 flex flex-wrap gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={isSubmittingProject}
                        className="px-7 py-3 rounded-full bg-lw-green text-white text-sm font-bold transition-all hover:-translate-y-0.5 hover:bg-lw-green-deep disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isSubmittingProject ? 'Sending...' : 'Send Idea'}
                      </button>
                      {projectSubmitNotice && (
                        <p className="self-center text-sm text-black/70">
                          {projectSubmitNotice}
                        </p>
                      )}
                      {projectUploadFile && (
                        <p className="self-center text-xs text-black/50">
                          Selected file: {projectUploadFile.name}
                        </p>
                      )}
                    </div>
                    {projectSubmitNotice && !projectUploadFile && (
                      <div className="md:col-span-2">
                        <p className="text-xs text-black/60">
                          Submitted by: {projectForm.fullName || 'User'}
                        </p>
                      </div>
                    )}
                    {!projectSubmitNotice && (
                      <div className="md:col-span-2">
                        <p className="text-xs text-black/50">
                          Your name, email, and contact number are included with every submission.
                        </p>
                      </div>
                    )}
                  </form>
                </div>
              </div>

              <div className="xl:col-span-5">
                <div className="rounded-[2rem] border border-white/20 bg-white/10 backdrop-blur-sm p-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Live Project Board</h3>
                  <p className="text-white/70 text-sm mb-5">A quick frame for sharing references and active links.</p>

                  <div className="overflow-x-auto rounded-2xl border border-white/15">
                    <table className="w-full min-w-[540px] border-collapse text-xs text-white">
                      <thead>
                        <tr className="bg-white/10 text-left">
                          <th className="px-4 py-3 uppercase tracking-widest border-b border-white/15">Project</th>
                          <th className="px-4 py-3 uppercase tracking-widest border-b border-white/15">URL</th>
                          <th className="px-4 py-3 uppercase tracking-widest border-b border-white/15">Stage</th>
                          <th className="px-4 py-3 uppercase tracking-widest border-b border-white/15">Focus</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissionRows.map((row, idx) => (
                          <tr key={row.name} className={idx % 2 === 0 ? 'bg-white/5' : 'bg-white/[0.03]'}>
                            <td className="px-4 py-3 border-b border-white/10">{row.name}</td>
                            <td className="px-4 py-3 border-b border-white/10 text-sky-200">{row.link}</td>
                            <td className="px-4 py-3 border-b border-white/10">{row.stage}</td>
                            <td className="px-4 py-3 border-b border-white/10">{row.focus}</td>
                          </tr>
                        ))}
                        <tr className="bg-white/[0.03]">
                          <td className="px-4 py-3 italic text-white/60">Your project</td>
                          <td className="px-4 py-3 italic text-white/60">Paste your deployed link</td>
                          <td className="px-4 py-3 italic text-white/60">Concept</td>
                          <td className="px-4 py-3 italic text-white/60">Your AI use case</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-5 rounded-xl border border-white/15 bg-white/10 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-widest text-white/60 mb-1">Pro Tip</p>
                    <p className="text-sm text-white/85">The best submissions include one link and one measurable success metric.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ProjectAccordionProps {
  openIndex: number | null;
  setOpenIndex: (index: number | null) => void;
}

const ProjectAccordion: React.FC<ProjectAccordionProps> = ({ openIndex, setOpenIndex }) => {

  const projects = [
    {
      id: "2.1",
      title: "AI Data Extraction",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
          <path d="M3 5V19A9 3 0 0 0 21 19V5"></path>
          <path d="M3 12A9 3 0 0 0 21 12"></path>
        </svg>
      ),
      description: "Using AI, we optimize the acquisition of image and text from multiple sources. Techniques include onsite scanning, drone photography, negotiation with archives and the formation of alliances with corporations, religious organizations and governments."
    },
    {
      id: "2.2",
      title: "Machine Learning Enablement",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v4"></path>
          <path d="m16.2 7.8 2.9-2.9"></path>
          <path d="M18 12h4"></path>
          <path d="m16.2 16.2 2.9 2.9"></path>
          <path d="M12 18v4"></path>
          <path d="m4.9 19.1 2.9-2.9"></path>
          <path d="M2 12h4"></path>
          <path d="m4.9 4.9 2.9 2.9"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      ),
      description: "Empowering machine learning models with high-quality, diverse datasets. We provide end-to-end support for model training, validation, and deployment across various industries."
    },
    {
      id: "2.3",
      title: "Autonomous Driving Technology",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path>
          <circle cx="7" cy="17" r="2"></circle>
          <path d="M9 17h6"></path>
          <circle cx="17" cy="17" r="2"></circle>
        </svg>
      ),
      description: "Specialized data solutions for the automotive industry, including complex scene annotation, sensor fusion data processing, and safety-critical edge case identification."
    },
    {
      id: "2.4",
      title: "AI-Enabled Customer Service",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          <path d="M8 9h.01"></path>
          <path d="M12 9h.01"></path>
          <path d="M16 9h.01"></path>
        </svg>
      ),
      description: "Transforming customer interactions with AI-driven support systems. We provide the linguistic and behavioral data necessary to build empathetic and efficient virtual assistants."
    },
    {
      id: "2.5",
      title: "Natural Language Processing and Speech Acquisition",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 8 6 6"></path>
          <path d="m4 14 6-6 2-3"></path>
          <path d="M2 5h12"></path>
          <path d="M7 2h1"></path>
          <path d="m22 22-5-10-5 10"></path>
          <path d="M14 18h6"></path>
        </svg>
      ),
      description: "Comprehensive multilingual data services for NLP and speech recognition. Our global network ensures high-fidelity data collection across 50+ languages and dialects."
    },
    {
      id: "2.6",
      title: "Computer Vision (CV)",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
          <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
          <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
          <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 8v8"></path>
          <path d="M8 12h8"></path>
        </svg>
      ),
      description: "Training Al to see and understand the world requires a high volume of quality training data. Lifewood provides total data solutions for your CV development from collection to annotation to classification and more, for video and image datasets enabling machines to interpret visual information. We have experience in a wide variety of applications including autonomous vehicles, farm monitoring, face recognition and more."
    },
    {
      id: "2.7",
      title: "Genealogy",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
          <path d="M9 20c0-1.5-1-2.5-1-2.5s-1 1-1 2.5"></path>
          <path d="M17 20c0-1.5-1-2.5-1-2.5s-1 1-1 2.5"></path>
          <path d="M12 20c0-1.5-1-2.5-1-2.5s-1 1-1 2.5"></path>
          <path d="M12 12V3"></path>
          <path d="M12 3c0 1.5-1 2.5-1 2.5s-1-1-1-2.5"></path>
          <path d="M12 3c0 1.5 1 2.5 1 2.5s 1-1 1-2.5"></path>
        </svg>
      ),
      description: (
        <div className="space-y-4">
          <p>
            Powered by Al, Lifewood processes genealogical material at speed and scale, to conserve and illuminate family histories, national archives, corporate lists and records of all types. Lifewood has more than 18 years of experience capturing, scanning and processing genealogical data. In fact, Lifewood started with genealogy data as its core business, so that over the years we have accumulated vast knowledge in diverse types of genealogy indexing.
          </p>
          <p>
            We have worked with all the major genealogy companies and have extensive experience in transcribing and indexing genealogical content in a wide variety of formats, including tabular, pre-printed forms and paragraph-style records.
          </p>
          <p>
            Working across borders, with offices on every continent, our ability with multi-language projects has built an extensive capability spanning more than 50 languages and associated dialects. Now, powered by Al and the latest inter-office communication systems, we are transforming ever more efficient ways to service our clients, while keeping humanity at the centre of our activity.
          </p>
          <div>
            <p className="font-bold mb-2">Genealogical material that we have experience with includes:</p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 list-disc pl-5">
              <li>Census</li>
              <li>Vital - BMD</li>
              <li>Church and Parish Registers</li>
              <li>Passenger Lists</li>
              <li>Naturalisation</li>
              <li>Military Records</li>
              <li>Legal Records</li>
              <li>Yearbooks</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="border-t border-black/10">
      {projects.map((project, index) => (
        <div key={project.id} className="border-bottom border-black/10">
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full py-6 flex items-center justify-between text-left group"
          >
            <div className="flex items-center gap-6">
              <div className="text-black opacity-60 group-hover:opacity-100 transition-opacity">
                {project.icon}
              </div>
              <span className="text-xl font-medium text-black">
                {project.id} {project.title}
              </span>
            </div>
            <div className="text-black">
              {openIndex === index ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              )}
            </div>
          </button>
          <div 
            className={`overflow-hidden transition-all duration-500 ease-in-out ${openIndex === index ? 'max-h-[800px] pb-8' : 'max-h-0'}`}
          >
            <div className="text-gray-600 text-lg leading-relaxed pl-[4.5rem] pr-8">
              {project.description}
            </div>
          </div>
          <div className="h-[1px] w-full bg-black/10"></div>
        </div>
      ))}
    </div>
  );
};

export default AIProjects;

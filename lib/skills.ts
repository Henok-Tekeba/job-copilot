export const SKILLS: Record<string, string[]> = {
  "Node.js": ["node", "nodejs", "node.js"],
  "TypeScript": ["typescript", "ts"],
  "JavaScript": ["javascript", "js"],
  "Python": ["python"],
  "Java": ["java"],
  "C++": ["c++", "cpp"],
  "C#": ["c#", "csharp", "dotnet", ".net"],
  "Golang": ["golang", "go lang"],
  "Rust": ["rust"],
  "Ruby": ["ruby"],
  "PHP": ["php"],
  "Swift": ["swift"],
  "Kotlin": ["kotlin"],
  "Scala": ["scala"],
  "React": ["react", "react.js", "reactjs"],
  "Next.js": ["next.js", "nextjs", "next"],
  "Vue.js": ["vue", "vue.js", "vuejs"],
  "Angular": ["angular", "angularjs"],
  "Svelte": ["svelte"],
  "Tailwind CSS": ["tailwind", "tailwindcss", "tailwind css"],
  "HTML": ["html", "html5"],
  "CSS": ["css", "css3"],
  "SASS": ["sass", "scss"],
  "Redux": ["redux"],
  "GraphQL": ["graphql"],
  "REST API": ["rest api", "restful", "rest"],
  "Express.js": ["express", "express.js", "expressjs"],
  "FastAPI": ["fastapi"],
  "Django": ["django"],
  "Flask": ["flask"],
  "Spring Boot": ["spring boot", "spring"],
  "Ruby on Rails": ["ruby on rails", "rails"],
  "Laravel": ["laravel"],
  "ASP.NET": ["asp.net", "aspnet"],
  "PostgreSQL": ["postgres", "postgresql"],
  "MySQL": ["mysql"],
  "MongoDB": ["mongo", "mongodb"],
  "Redis": ["redis"],
  "SQLite": ["sqlite"],
  "Firebase": ["firebase"],
  "Supabase": ["supabase"],
  "Prisma": ["prisma"],
  "Docker": ["docker"],
  "Kubernetes": ["kubernetes", "k8s"],
  "AWS": ["aws", "amazon web services"],
  "Azure": ["azure", "microsoft azure"],
  "GCP": ["gcp", "google cloud", "google cloud platform"],
  "Git": ["git"],
  "GitHub Actions": ["github actions", "gh actions"],
  "CI/CD": ["ci/cd", "cicd", "continuous integration", "continuous deployment"],
  "Jenkins": ["jenkins"],
  "Terraform": ["terraform"],
  "Linux": ["linux"],
  "Nginx": ["nginx"],
  "Apache": ["apache"],
  "Vercel": ["vercel"],
  "Netlify": ["netlify"],
  "Heroku": ["heroku"],
  "Figma": ["figma"],
  "Jest": ["jest"],
  "Cypress": ["cypress"],
  "Playwright": ["playwright"],
  "Selenium": ["selenium"],
  "Webpack": ["webpack"],
  "Vite": ["vite"],
  "Babel": ["babel"],
  "ESLint": ["eslint"],
  "Prettier": ["prettier"],
  "Jira": ["jira"],
  "Confluence": ["confluence"],
  "Slack": ["slack"],
  "Notion": ["notion"],
  "NumPy": ["numpy"],
  "TensorFlow": ["tensorflow"],
  "PyTorch": ["pytorch"],
  "Scikit-learn": ["scikit-learn", "sklearn"],
  "OpenCV": ["opencv"],
  "Tableau": ["tableau"],
  "Power BI": ["power bi", "powerbi"],
  "Excel": ["excel"],
  "Spark": ["spark", "apache spark"],
  "Hadoop": ["hadoop"],
  "Kafka": ["kafka"],
  "RabbitMQ": ["rabbitmq"],
  "Microservices": ["microservices", "microservices"],
  "System Design": ["system design", "systems design"],
  "Agile": ["agile"],
  "Scrum": ["scrum"],
  "TDD": ["tdd", "test driven development", "test-driven development"],
  "Unit Testing": ["unit testing", "unit tests"],
};

/**
 * Skills that indicate real engineering work. Everything outside this set is
 * productivity/PM tooling that appears in almost any posting, so it should not
 * on its own make a non-technical role count as a software job.
 */
const NON_ENGINEERING_SKILLS = new Set([
  "Figma",
  "Jira",
  "Confluence",
  "Slack",
  "Notion",
  "Tableau",
  "Power BI",
  "Excel",
  "Agile",
  "Scrum",
]);

export const CORE_ENGINEERING_SKILLS = Object.keys(SKILLS).filter(
  (skill) => !NON_ENGINEERING_SKILLS.has(skill)
);

/**
 * Titles that are never software roles.
 *
 * Checked BEFORE the engineering-keyword search, because "Junior Business
 * Developer" contains "developer" and would otherwise pass. Ambiguous words that
 * appear in engineering titles as team names ("Marketing", "Design", "Finance")
 * are deliberately absent — a "Marketing Manager" fails the keyword check
 * anyway, while "Software Engineer, Marketing" must not be thrown away.
 */
export const NON_TECH_TITLE_PATTERN =
  /\b(sales|business develop(er|ment)?|bizdev|business dev|recruit(er|ing)|account (manager|executive)|customer (support|success|service)|office assistant|virtual assistant|copywriter|content (writer|marketer)|social media|community manager|student assistant|bookkeep|accountant|human resources|people ops|executive assistant|operations manager)\b/i;

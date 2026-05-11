import * as fs from 'node:fs'
import * as path from 'node:path'

const skillContextPath = path.join(process.cwd(), 'src/lib/ai/arkivSkills.txt')

const GITHUB_REPO_OWNER = 'Arkiv-Network'
const GITHUB_REPO_NAME = 'skills'
const GITHUB_BRANCH = 'main'
const SKILL_PATH_PREFIX = 'skills/arkiv-best-practices/'
const REQUEST_TIMEOUT_MS = 12000

type SkillContextSource = 'github' | 'memory-cache' | 'local-file'

export type SkillContextResult = {
  context: string
  source: SkillContextSource
}

type GithubTreeResponse = {
  tree?: Array<{ path?: string; type?: string }>
  truncated?: boolean
}

let lastGoodSkillContext: string | null = null

export const resetSkillContextCacheForTests = () => {
  lastGoodSkillContext = null
}

const getGithubToken = () =>
  process.env.ARKIV_SKILLS_GITHUB_TOKEN ||
  process.env.GITHUB_TOKEN ||
  process.env.GH_TOKEN

const buildGithubHeaders = () => {
  const token = getGithubToken()

  return {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

const getLocalSkillContext = () => fs.readFileSync(skillContextPath, 'utf-8')

const fetchSkillMarkdownPaths = async () => {
  const treeUrl = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/git/trees/${GITHUB_BRANCH}?recursive=1`
  const response = await fetch(treeUrl, {
    headers: buildGithubHeaders(),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(`GitHub tree fetch failed with status ${response.status}.`)
  }

  const payload = (await response.json()) as GithubTreeResponse

  if (!Array.isArray(payload.tree)) {
    throw new Error('GitHub tree response did not include a file tree.')
  }

  if (payload.truncated) {
    throw new Error('GitHub tree response was truncated.')
  }

  return payload.tree
    .filter((entry) => entry.type === 'blob' && typeof entry.path === 'string')
    .map((entry) => entry.path as string)
    .filter(
      (filePath) =>
        filePath.startsWith(SKILL_PATH_PREFIX) && filePath.endsWith('.md'),
    )
    .sort((left, right) => left.localeCompare(right))
}

const fetchMarkdownFile = async (filePath: string) => {
  const rawUrl = `https://raw.githubusercontent.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/${GITHUB_BRANCH}/${filePath}`
  const response = await fetch(rawUrl, {
    headers: buildGithubHeaders(),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(
      `GitHub markdown fetch failed for ${filePath} with status ${response.status}.`,
    )
  }

  return response.text()
}

const fetchSkillContextFromGithub = async () => {
  const markdownPaths = await fetchSkillMarkdownPaths()

  if (markdownPaths.length === 0) {
    throw new Error('No markdown files found in arkiv-best-practices skill path.')
  }

  const markdownContents = await Promise.all(
    markdownPaths.map(async (filePath) => ({
      filePath,
      content: await fetchMarkdownFile(filePath),
    })),
  )

  return markdownContents
    .map(({ filePath, content }) => `${filePath}:\n${content}`)
    .join('\n\n')
}

export const getSkillContextResult = async (): Promise<SkillContextResult> => {
  try {
    const githubContext = await fetchSkillContextFromGithub()
    lastGoodSkillContext = githubContext

    return {
      context: githubContext,
      source: 'github',
    }
  } catch (githubError) {
    console.warn('[ai:skill-context] github fetch failed, using fallback', {
      error:
        githubError instanceof Error ? githubError.message : String(githubError),
    })

    if (lastGoodSkillContext) {
      return {
        context: lastGoodSkillContext,
        source: 'memory-cache',
      }
    }

    return {
      context: getLocalSkillContext(),
      source: 'local-file',
    }
  }
}

export const getSkillContext = async () => {
  const { context } = await getSkillContextResult()
  return context
}

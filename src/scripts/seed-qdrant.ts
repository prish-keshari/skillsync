import "dotenv/config";
import Groq from "groq-sdk";
import { QdrantClient } from "@qdrant/js-client-rest";

const COLLECTION_NAME = "university_knowledge";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
});

const documents = [
    {
        text: "The passing criteria for the Compiler Design Lab is a minimum of 60% in the internal assessment and successful completion of at least 8 out of 10 lab experiments. Students must also pass the end-semester viva with a minimum of 50% marks.",
        metadata: { course: "Compiler Design Lab", type: "passing_criteria" },
    },
    {
        text: "The Data Structures and Algorithms course has the following syllabus: Arrays, Linked Lists, Stacks, Queues, Trees (Binary, AVL, B-Tree), Graphs (BFS, DFS, Dijkstra), Hashing, Sorting Algorithms (Quick, Merge, Heap), and Dynamic Programming. The course carries 4 credits.",
        metadata: { course: "DSA", type: "syllabus" },
    },
    {
        text: "Lab timings are scheduled from 9:00 AM to 12:00 PM for morning batches and 2:00 PM to 5:00 PM for afternoon batches. Students must carry their lab manual and ID card for every session. Late entry after 15 minutes is not permitted.",
        metadata: { type: "lab_rules" },
    },
    {
        text: "The Operating Systems course covers: Process Management (scheduling, synchronization, deadlocks), Memory Management (paging, segmentation, virtual memory), File Systems (FAT, NTFS, ext4), and I/O Systems. The end semester exam pattern is 5 questions from 8, each carrying 16 marks.",
        metadata: { course: "Operating Systems", type: "syllabus" },
    },
    {
        text: "The university follows a CGPA grading system: A+ (10), A (9), B+ (8), B (7), C+ (6), C (5), D (4), F (0). A minimum CGPA of 5.0 is required for graduation. Students with CGPA below 4.0 are placed on academic probation.",
        metadata: { type: "grading_system" },
    },
    {
        text: "Computer Networks Lab experiments include: Socket Programming in C, Implementation of Stop-and-Wait Protocol, Sliding Window Protocol, Distance Vector Routing, Link State Routing, DNS Lookup, HTTP Server implementation, and Network packet analysis using Wireshark.",
        metadata: { course: "Computer Networks Lab", type: "experiments" },
    },
    {
        text: "The Machine Learning elective covers: Linear Regression, Logistic Regression, Decision Trees, Random Forests, SVM, Neural Networks basics, CNNs, RNNs, K-Means Clustering, PCA, and an introduction to Reinforcement Learning. Prerequisites: Probability & Statistics, Linear Algebra.",
        metadata: { course: "Machine Learning", type: "syllabus" },
    },
    {
        text: "Project submission guidelines: Final year projects must be submitted by April 15th. The project report should follow IEEE format with a minimum of 60 pages. Teams of 2-4 students are allowed. Each team must demonstrate a working prototype during the viva.",
        metadata: { type: "project_guidelines" },
    },
];

async function getEmbedding(text: string): Promise<number[]> {
    const response = await groq.embeddings.create({
        model: "nomic-embed-text-v1_5",
        input: text,
    });
    return response.data[0]!.embedding as number[];
}

async function seed() {
    console.log("🌱 Starting Qdrant seed...\n");


    try {
        await qdrant.deleteCollection(COLLECTION_NAME);
        console.log("Deleted existing collection");
    } catch {

    }


    const sampleEmbedding = await getEmbedding("test");
    const dimension = sampleEmbedding.length;
    console.log(`Embedding dimension: ${dimension}`);

    await qdrant.createCollection(COLLECTION_NAME, {
        vectors: { size: dimension, distance: "Cosine" },
    });
    console.log(`Created collection: ${COLLECTION_NAME}\n`);


    for (let i = 0; i < documents.length; i++) {
        const doc = documents[i]!;
        console.log(`[${i + 1}/${documents.length}] Embedding: "${doc.text.slice(0, 60)}..."`);

        const embedding = await getEmbedding(doc.text);

        await qdrant.upsert(COLLECTION_NAME, {
            points: [
                {
                    id: i + 1,
                    vector: embedding,
                    payload: { text: doc.text, ...doc.metadata },
                },
            ],
        });
    }

    console.log(`\n✅ Seeded ${documents.length} documents into Qdrant!`);
}

seed().catch(console.error);

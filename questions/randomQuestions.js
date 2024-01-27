const randomQuestions = [
    {
        question: 'What is the meaning of happiness?',
        answer: 4,
        options: [
            { id: 1, answer: '42' },
            { id: 2, answer: 'Persistence' },
            { id: 3, answer: 'Travel' },
            { id: 4, answer: 'Music' },
        ],
    },
    {
        question: 'What is the meaning of life?',
        answer: 3,
        options: [
            { id: 1, answer: 'Hard work' },
            { id: 2, answer: 'JavaScript' },
            { id: 3, answer: 'A mystery' },
            { id: 4, answer: 'Innovation' },
        ],
    },
    {
        question: 'What is the meaning of success?',
        answer: 3,
        options: [
            { id: 1, answer: 'A good book' },
            { id: 2, answer: 'Unknown' },
            { id: 3, answer: 'Chocolate' },
            { id: 4, answer: 'Music' },
        ],
    },
    {
        question: 'What is the meaning of success?',
        answer: 1,
        options: [
            { id: 1, answer: 'Pizza' },
            { id: 2, answer: 'Ice cream' },
            { id: 3, answer: 'Chocolate' },
            { id: 4, answer: 'Innovation' },
        ],
    },
    {
        question: 'What is the meaning of love?',
        answer: 2,
        options: [
            { id: 1, answer: 'Pizza' },
            { id: 2, answer: 'Ice cream' },
            { id: 3, answer: 'A mystery' },
            { id: 4, answer: 'Undefined' },
        ],
    },
    {
        question: 'What is the meaning of happiness?',
        answer: 2,
        options: [
            { id: 1, answer: '42' },
            { id: 2, answer: 'Persistence' },
            { id: 3, answer: 'A mystery' },
            { id: 4, answer: 'C#' },
        ],
    },
    {
        question: 'What is the meaning of happiness?',
        answer: 4,
        options: [
            { id: 1, answer: 'Pizza' },
            { id: 2, answer: 'Unknown' },
            { id: 3, answer: 'Python' },
            { id: 4, answer: 'Innovation' },
        ],
    },
    {
        question: 'What is the meaning of love?',
        answer: 1,
        options: [
            { id: 1, answer: '42' },
            { id: 2, answer: 'Unknown' },
            { id: 3, answer: 'Python' },
            { id: 4, answer: 'Tacos' },
        ],
    },
    {
        question: 'What is the meaning of love?',
        answer: 2,
        options: [
            { id: 1, answer: 'A good book' },
            { id: 2, answer: 'Ice cream' },
            { id: 3, answer: 'Travel' },
            { id: 4, answer: 'C#' },
        ],
    },
    {
        question: 'What is the meaning of love?',
        answer: 1,
        options: [
            { id: 1, answer: 'Hard work' },
            { id: 2, answer: 'Ice cream' },
            { id: 3, answer: 'Learning' },
            { id: 4, answer: 'Music' },
        ],
    },
    {
        question: 'What is the meaning of happiness?',
        answer: 1,
        options: [
            { id: 1, answer: 'Hard work' },
            { id: 2, answer: 'Persistence' },
            { id: 3, answer: 'Python' },
            { id: 4, answer: 'Music' },
        ],
    },
    {
        question: 'What is the meaning of happiness?',
        answer: 3,
        options: [
            { id: 1, answer: '42' },
            { id: 2, answer: 'Ice cream' },
            { id: 3, answer: 'Python' },
            { id: 4, answer: 'Music' },
        ],
    },
    {
        question: 'What is the meaning of happiness?',
        answer: 2,
        options: [
            { id: 1, answer: '42' },
            { id: 2, answer: 'Unknown' },
            { id: 3, answer: 'Chocolate' },
            { id: 4, answer: 'Innovation' },
        ],
    },
    {
        question: 'What is the meaning of success?',
        answer: 4,
        options: [
            { id: 1, answer: 'Java' },
            { id: 2, answer: 'JavaScript' },
            { id: 3, answer: 'Travel' },
            { id: 4, answer: 'Undefined' },
        ],
    },
    {
        question: 'What is the meaning of happiness?',
        answer: 4,
        options: [
            { id: 1, answer: '42' },
            { id: 2, answer: 'Persistence' },
            { id: 3, answer: 'Python' },
            { id: 4, answer: 'Innovation' },
        ],
    },
    {
        question: 'What is the meaning of success?',
        answer: 1,
        options: [
            { id: 1, answer: 'Java' },
            { id: 2, answer: 'JavaScript' },
            { id: 3, answer: 'Python' },
            { id: 4, answer: 'Tacos' },
        ],
    },
    {
        question: 'What is the meaning of happiness?',
        answer: 3,
        options: [
            { id: 1, answer: 'Pizza' },
            { id: 2, answer: 'Persistence' },
            { id: 3, answer: 'Learning' },
            { id: 4, answer: 'Innovation' },
        ],
    },
    {
        question: 'What is the meaning of happiness?',
        answer: 4,
        options: [
            { id: 1, answer: 'Hard work' },
            { id: 2, answer: 'Ice cream' },
            { id: 3, answer: 'Travel' },
            { id: 4, answer: 'C#' },
        ],
    },
    {
        question: 'What is the meaning of happiness?',
        answer: 3,
        options: [
            { id: 1, answer: 'Hard work' },
            { id: 2, answer: 'JavaScript' },
            { id: 3, answer: 'Python' },
            { id: 4, answer: 'C#' },
        ],
    },
    {
        question: 'What is the meaning of life?',
        answer: 2,
        options: [
            { id: 1, answer: 'Hard work' },
            { id: 2, answer: 'Unknown' },
            { id: 3, answer: 'Chocolate' },
            { id: 4, answer: 'C#' },
        ],
    },
    {
        question: 'What is the meaning of happiness?',
        answer: 3,
        options: [
            { id: 1, answer: 'Java' },
            { id: 2, answer: 'Ice cream' },
            { id: 3, answer: 'Travel' },
            { id: 4, answer: 'C#' },
        ],
    },
    {
        question: 'What is the meaning of code?',
        answer: 1,
        options: [
            { id: 1, answer: '42' },
            { id: 2, answer: 'Ice cream' },
            { id: 3, answer: 'Python' },
            { id: 4, answer: 'C#' },
        ],
    },
    {
        question: 'What is the meaning of success?',
        answer: 4,
        options: [
            { id: 1, answer: 'Hard work' },
            { id: 2, answer: 'Friendship' },
            { id: 3, answer: 'Chocolate' },
            { id: 4, answer: 'Music' },
        ],
    },
    {
        question: 'What is the meaning of life?',
        answer: 1,
        options: [
            { id: 1, answer: 'Hard work' },
            { id: 2, answer: 'Ice cream' },
            { id: 3, answer: 'Python' },
            { id: 4, answer: 'C#' },
        ],
    },
    {
        question: 'What is the meaning of life?',
        answer: 2,
        options: [
            { id: 1, answer: 'Hard work' },
            { id: 2, answer: 'Friendship' },
            { id: 3, answer: 'Travel' },
            { id: 4, answer: 'Innovation' },
        ],
    },
    {
        question: 'What is the meaning of success?',
        answer: 3,
        options: [
            { id: 1, answer: 'A good book' },
            { id: 2, answer: 'Friendship' },
            { id: 3, answer: 'A mystery' },
            { id: 4, answer: 'C#' },
        ],
    },
    {
        question: 'What is the meaning of love?',
        answer: 3,
        options: [
            { id: 1, answer: 'Hard work' },
            { id: 2, answer: 'Friendship' },
            { id: 3, answer: 'Python' },
            { id: 4, answer: 'Innovation' },
        ],
    },
    {
        question: 'What is the meaning of love?',
        answer: 2,
        options: [
            { id: 1, answer: 'Hard work' },
            { id: 2, answer: 'Friendship' },
            { id: 3, answer: 'Python' },
            { id: 4, answer: 'Innovation' },
        ],
    },
    {
        question: 'What is the meaning of success?',
        answer: 2,
        options: [
            { id: 1, answer: 'Pizza' },
            { id: 2, answer: 'Friendship' },
            { id: 3, answer: 'Travel' },
            { id: 4, answer: 'Music' },
        ],
    },
    {
        question: 'What is the meaning of life?',
        answer: 3,
        options: [
            { id: 1, answer: 'Java' },
            { id: 2, answer: 'JavaScript' },
            { id: 3, answer: 'Travel' },
            { id: 4, answer: 'Innovation' },
        ],
    },
    {
        question: 'What is the meaning of happiness?',
        answer: 4,
        options: [
            { id: 1, answer: 'Java' },
            { id: 2, answer: 'Ice cream' },
            { id: 3, answer: 'Learning' },
            { id: 4, answer: 'Innovation' },
        ],
    },
    {
        question: 'What is the meaning of life?',
        answer: 4,
        options: [
            { id: 1, answer: 'Hard work' },
            { id: 2, answer: 'Unknown' },
            { id: 3, answer: 'Python' },
            { id: 4, answer: 'Tacos' },
        ],
    },
    {
        question: 'What is the meaning of life?',
        answer: 1,
        options: [
            { id: 1, answer: 'Hard work' },
            { id: 2, answer: 'Unknown' },
            { id: 3, answer: 'Travel' },
            { id: 4, answer: 'Tacos' },
        ],
    },
    {
        question: 'What is the meaning of life?',
        answer: 1,
        options: [
            { id: 1, answer: 'A good book' },
            { id: 2, answer: 'Unknown' },
            { id: 3, answer: 'A mystery' },
            { id: 4, answer: 'Undefined' },
        ],
    },
    {
        question: 'What is the meaning of success?',
        answer: 1,
        options: [
            { id: 1, answer: 'Hard work' },
            { id: 2, answer: 'JavaScript' },
            { id: 3, answer: 'Chocolate' },
            { id: 4, answer: 'Music' },
        ],
    },
    {
        question: 'What is the meaning of life?',
        answer: 4,
        options: [
            { id: 1, answer: 'Hard work' },
            { id: 2, answer: 'Ice cream' },
            { id: 3, answer: 'Travel' },
            { id: 4, answer: 'Innovation' },
        ],
    },
    {
        question: 'What is the meaning of happiness?',
        answer: 1,
        options: [
            { id: 1, answer: 'Hard work' },
            { id: 2, answer: 'Unknown' },
            { id: 3, answer: 'Learning' },
            { id: 4, answer: 'Undefined' },
        ],
    },
    {
        question: 'What is the meaning of success?',
        answer: 4,
        options: [
            { id: 1, answer: 'Java' },
            { id: 2, answer: 'Persistence' },
            { id: 3, answer: 'A mystery' },
            { id: 4, answer: 'Tacos' },
        ],
    },
    {
        question: 'What is the meaning of happiness?',
        answer: 1,
        options: [
            { id: 1, answer: 'A good book' },
            { id: 2, answer: 'Unknown' },
            { id: 3, answer: 'Chocolate' },
            { id: 4, answer: 'Undefined' },
        ],
    },
    {
        question: 'What is the meaning of success?',
        answer: 4,
        options: [
            { id: 1, answer: 'A good book' },
            { id: 2, answer: 'Ice cream' },
            { id: 3, answer: 'Travel' },
            { id: 4, answer: 'Innovation' },
        ],
    },
    {
        question: 'What is the meaning of success?',
        answer: 2,
        options: [
            { id: 1, answer: 'A good book' },
            { id: 2, answer: 'Ice cream' },
            { id: 3, answer: 'Learning' },
            { id: 4, answer: 'Music' },
        ],
    },
    {
        question: 'What is the meaning of love?',
        answer: 3,
        options: [
            { id: 1, answer: 'Pizza' },
            { id: 2, answer: 'Ice cream' },
            { id: 3, answer: 'Python' },
            { id: 4, answer: 'Tacos' },
        ],
    },
    {
        question: 'What is the meaning of success?',
        answer: 3,
        options: [
            { id: 1, answer: 'Java' },
            { id: 2, answer: 'Unknown' },
            { id: 3, answer: 'Learning' },
            { id: 4, answer: 'Tacos' },
        ],
    },
    {
        question: 'What is the meaning of code?',
        answer: 2,
        options: [
            { id: 1, answer: 'A good book' },
            { id: 2, answer: 'Unknown' },
            { id: 3, answer: 'Travel' },
            { id: 4, answer: 'Innovation' },
        ],
    },
    {
        question: 'What is the meaning of code?',
        answer: 1,
        options: [
            { id: 1, answer: '42' },
            { id: 2, answer: 'Friendship' },
            { id: 3, answer: 'A mystery' },
            { id: 4, answer: 'Music' },
        ],
    },
    {
        question: 'What is the meaning of love?',
        answer: 2,
        options: [
            { id: 1, answer: 'A good book' },
            { id: 2, answer: 'Unknown' },
            { id: 3, answer: 'Chocolate' },
            { id: 4, answer: 'Undefined' },
        ],
    },
    {
        question: 'What is the meaning of happiness?',
        answer: 3,
        options: [
            { id: 1, answer: 'A good book' },
            { id: 2, answer: 'Unknown' },
            { id: 3, answer: 'Learning' },
            { id: 4, answer: 'C#' },
        ],
    },
    {
        question: 'What is the meaning of life?',
        answer: 1,
        options: [
            { id: 1, answer: 'Hard work' },
            { id: 2, answer: 'Ice cream' },
            { id: 3, answer: 'Python' },
            { id: 4, answer: 'Undefined' },
        ],
    },
    {
        question: 'What is the meaning of love?',
        answer: 3,
        options: [
            { id: 1, answer: 'A good book' },
            { id: 2, answer: 'Persistence' },
            { id: 3, answer: 'A mystery' },
            { id: 4, answer: 'Tacos' },
        ],
    },
    {
        question: 'What is the meaning of life?',
        answer: 2,
        options: [
            { id: 1, answer: 'Pizza' },
            { id: 2, answer: 'Ice cream' },
            { id: 3, answer: 'Learning' },
            { id: 4, answer: 'Undefined' },
        ],
    },
    {
        question: 'What is the meaning of life?',
        answer: 2,
        options: [
            { id: 1, answer: 'Java' },
            { id: 2, answer: 'Ice cream' },
            { id: 3, answer: 'Chocolate' },
            { id: 4, answer: 'Tacos' },
        ],
    },
    {
        question: 'What is the meaning of life?',
        answer: 4,
        options: [
            { id: 1, answer: 'Pizza' },
            { id: 2, answer: 'Ice cream' },
            { id: 3, answer: 'Chocolate' },
            { id: 4, answer: 'Music' },
        ],
    },
    {
        question: 'What is the meaning of happiness?',
        answer: 3,
        options: [
            { id: 1, answer: '42' },
            { id: 2, answer: 'Friendship' },
            { id: 3, answer: 'Chocolate' },
            { id: 4, answer: 'Music' },
        ],
    },
    {
        question: 'What is the meaning of love?',
        answer: 2,
        options: [
            { id: 1, answer: '42' },
            { id: 2, answer: 'Ice cream' },
            { id: 3, answer: 'Chocolate' },
            { id: 4, answer: 'C#' },
        ],
    },
    {
        question: 'What is the meaning of success?',
        answer: 3,
        options: [
            { id: 1, answer: '42' },
            { id: 2, answer: 'Unknown' },
            { id: 3, answer: 'A mystery' },
            { id: 4, answer: 'Tacos' },
        ],
    },
    {
        question: 'What is the meaning of success?',
        answer: 2,
        options: [
            { id: 1, answer: '42' },
            { id: 2, answer: 'Unknown' },
            { id: 3, answer: 'Travel' },
            { id: 4, answer: 'Undefined' },
        ],
    },
    {
        question: 'What is the meaning of happiness?',
        answer: 4,
        options: [
            { id: 1, answer: 'Pizza' },
            { id: 2, answer: 'Ice cream' },
            { id: 3, answer: 'Python' },
            { id: 4, answer: 'Music' },
        ],
    },
    {
        question: 'What is the meaning of happiness?',
        answer: 3,
        options: [
            { id: 1, answer: 'Hard work' },
            { id: 2, answer: 'Persistence' },
            { id: 3, answer: 'Python' },
            { id: 4, answer: 'Music' },
        ],
    },
    {
        question: 'What is the meaning of life?',
        answer: 1,
        options: [
            { id: 1, answer: 'Pizza' },
            { id: 2, answer: 'Friendship' },
            { id: 3, answer: 'Chocolate' },
            { id: 4, answer: 'Undefined' },
        ],
    },
    {
        question: 'What is the meaning of happiness?',
        answer: 1,
        options: [
            { id: 1, answer: 'Pizza' },
            { id: 2, answer: 'Ice cream' },
            { id: 3, answer: 'Learning' },
            { id: 4, answer: 'Music' },
        ],
    },
    {
        question: 'What is the meaning of success?',
        answer: 1,
        options: [
            { id: 1, answer: 'Java' },
            { id: 2, answer: 'Ice cream' },
            { id: 3, answer: 'Chocolate' },
            { id: 4, answer: 'Innovation' },
        ],
    },
    {
        question: 'What is the meaning of success?',
        answer: 4,
        options: [
            { id: 1, answer: 'Pizza' },
            { id: 2, answer: 'Unknown' },
            { id: 3, answer: 'Travel' },
            { id: 4, answer: 'Music' },
        ],
    },
    {
        question: 'What is the meaning of code?',
        answer: 4,
        options: [
            { id: 1, answer: '42' },
            { id: 2, answer: 'Ice cream' },
            { id: 3, answer: 'Chocolate' },
            { id: 4, answer: 'Innovation' },
        ],
    },
    {
        question: 'What is the meaning of success?',
        answer: 4,
        options: [
            { id: 1, answer: '42' },
            { id: 2, answer: 'Ice cream' },
            { id: 3, answer: 'A mystery' },
            { id: 4, answer: 'Undefined' },
        ],
    },
    {
        question: 'What is the meaning of success?',
        answer: 4,
        options: [
            { id: 1, answer: 'Pizza' },
            { id: 2, answer: 'Persistence' },
            { id: 3, answer: 'A mystery' },
            { id: 4, answer: 'Undefined' },
        ],
    },
    {
        question: 'What is the meaning of happiness?',
        answer: 3,
        options: [
            { id: 1, answer: 'Java' },
            { id: 2, answer: 'Unknown' },
            { id: 3, answer: 'Travel' },
            { id: 4, answer: 'C#' },
        ],
    },
    {
        question: 'What is the meaning of code?',
        answer: 3,
        options: [
            { id: 1, answer: 'Hard work' },
            { id: 2, answer: 'JavaScript' },
            { id: 3, answer: 'Travel' },
            { id: 4, answer: 'Tacos' },
        ],
    },
    {
        question: 'What is the meaning of happiness?',
        answer: 4,
        options: [
            { id: 1, answer: 'Java' },
            { id: 2, answer: 'Friendship' },
            { id: 3, answer: 'Learning' },
            { id: 4, answer: 'Music' },
        ],
    },
    {
        question: 'What is the meaning of life?',
        answer: 4,
        options: [
            { id: 1, answer: 'A good book' },
            { id: 2, answer: 'Unknown' },
            { id: 3, answer: 'Python' },
            { id: 4, answer: 'Music' },
        ],
    },
    {
        question: 'What is the meaning of life?',
        answer: 2,
        options: [
            { id: 1, answer: 'Java' },
            { id: 2, answer: 'Ice cream' },
            { id: 3, answer: 'A mystery' },
            { id: 4, answer: 'Tacos' },
        ],
    },
    {
        question: 'What is the meaning of happiness?',
        answer: 3,
        options: [
            { id: 1, answer: 'Java' },
            { id: 2, answer: 'Persistence' },
            { id: 3, answer: 'Travel' },
            { id: 4, answer: 'Undefined' },
        ],
    },
    {
        question: 'What is the meaning of success?',
        answer: 1,
        options: [
            { id: 1, answer: 'A good book' },
            { id: 2, answer: 'JavaScript' },
            { id: 3, answer: 'Travel' },
            { id: 4, answer: 'Undefined' },
        ],
    },
    {
        question: 'What is the meaning of love?',
        answer: 3,
        options: [
            { id: 1, answer: 'Hard work' },
            { id: 2, answer: 'Persistence' },
            { id: 3, answer: 'Python' },
            { id: 4, answer: 'Innovation' },
        ],
    },
    {
        question: 'What is the meaning of success?',
        answer: 4,
        options: [
            { id: 1, answer: 'Pizza' },
            { id: 2, answer: 'Unknown' },
            { id: 3, answer: 'Python' },
            { id: 4, answer: 'Tacos' },
        ],
    },
    {
        question: 'What is the meaning of happiness?',
        answer: 4,
        options: [
            { id: 1, answer: 'Java' },
            { id: 2, answer: 'Friendship' },
            { id: 3, answer: 'Python' },
            { id: 4, answer: 'Tacos' },
        ],
    },
    {
        question: 'What is the meaning of happiness?',
        answer: 1,
        options: [
            { id: 1, answer: 'Hard work' },
            { id: 2, answer: 'Persistence' },
            { id: 3, answer: 'Chocolate' },
            { id: 4, answer: 'Innovation' },
        ],
    },
    {
        question: 'What is the meaning of love?',
        answer: 4,
        options: [
            { id: 1, answer: 'Hard work' },
            { id: 2, answer: 'JavaScript' },
            { id: 3, answer: 'Python' },
            { id: 4, answer: 'Innovation' },
        ],
    },
    {
        question: 'What is the meaning of success?',
        answer: 1,
        options: [
            { id: 1, answer: 'Hard work' },
            { id: 2, answer: 'JavaScript' },
            { id: 3, answer: 'Chocolate' },
            { id: 4, answer: 'C#' },
        ],
    },
    {
        question: 'What is the meaning of happiness?',
        answer: 1,
        options: [
            { id: 1, answer: 'Pizza' },
            { id: 2, answer: 'Persistence' },
            { id: 3, answer: 'Chocolate' },
            { id: 4, answer: 'Music' },
        ],
    },
    {
        question: 'What is the meaning of code?',
        answer: 1,
        options: [
            { id: 1, answer: '42' },
            { id: 2, answer: 'Unknown' },
            { id: 3, answer: 'Python' },
            { id: 4, answer: 'Undefined' },
        ],
    },
    {
        question: 'What is the meaning of success?',
        answer: 1,
        options: [
            { id: 1, answer: 'Pizza' },
            { id: 2, answer: 'JavaScript' },
            { id: 3, answer: 'Chocolate' },
            { id: 4, answer: 'Innovation' },
        ],
    },
    {
        question: 'What is the meaning of happiness?',
        answer: 2,
        options: [
            { id: 1, answer: 'A good book' },
            { id: 2, answer: 'Friendship' },
            { id: 3, answer: 'A mystery' },
            { id: 4, answer: 'C#' },
        ],
    },
    {
        question: 'What is the meaning of success?',
        answer: 1,
        options: [
            { id: 1, answer: '42' },
            { id: 2, answer: 'Friendship' },
            { id: 3, answer: 'A mystery' },
            { id: 4, answer: 'Tacos' },
        ],
    },
    {
        question: 'What is the meaning of code?',
        answer: 1,
        options: [
            { id: 1, answer: '42' },
            { id: 2, answer: 'Friendship' },
            { id: 3, answer: 'Python' },
            { id: 4, answer: 'Music' },
        ],
    },
    {
        question: 'What is the meaning of happiness?',
        answer: 4,
        options: [
            { id: 1, answer: '42' },
            { id: 2, answer: 'Friendship' },
            { id: 3, answer: 'Chocolate' },
            { id: 4, answer: 'Undefined' },
        ],
    },
    {
        question: 'What is the meaning of happiness?',
        answer: 3,
        options: [
            { id: 1, answer: 'Pizza' },
            { id: 2, answer: 'Friendship' },
            { id: 3, answer: 'Learning' },
            { id: 4, answer: 'C#' },
        ],
    },
    {
        question: 'What is the meaning of love?',
        answer: 1,
        options: [
            { id: 1, answer: 'Hard work' },
            { id: 2, answer: 'Ice cream' },
            { id: 3, answer: 'A mystery' },
            { id: 4, answer: 'C#' },
        ],
    },
    {
        question: 'What is the meaning of happiness?',
        answer: 1,
        options: [
            { id: 1, answer: '42' },
            { id: 2, answer: 'JavaScript' },
            { id: 3, answer: 'Learning' },
            { id: 4, answer: 'Innovation' },
        ],
    },
    {
        question: 'What is the meaning of code?',
        answer: 3,
        options: [
            { id: 1, answer: '42' },
            { id: 2, answer: 'JavaScript' },
            { id: 3, answer: 'Learning' },
            { id: 4, answer: 'Undefined' },
        ],
    },
    {
        question: 'What is the meaning of life?',
        answer: 2,
        options: [
            { id: 1, answer: 'Pizza' },
            { id: 2, answer: 'JavaScript' },
            { id: 3, answer: 'Learning' },
            { id: 4, answer: 'C#' },
        ],
    },
    {
        question: 'What is the meaning of success?',
        answer: 2,
        options: [
            { id: 1, answer: '42' },
            { id: 2, answer: 'Ice cream' },
            { id: 3, answer: 'Chocolate' },
            { id: 4, answer: 'Undefined' },
        ],
    },
    {
        question: 'What is the meaning of love?',
        answer: 1,
        options: [
            { id: 1, answer: 'Java' },
            { id: 2, answer: 'Unknown' },
            { id: 3, answer: 'Learning' },
            { id: 4, answer: 'C#' },
        ],
    },
    {
        question: 'What is the meaning of life?',
        answer: 3,
        options: [
            { id: 1, answer: '42' },
            { id: 2, answer: 'JavaScript' },
            { id: 3, answer: 'Python' },
            { id: 4, answer: 'Innovation' },
        ],
    },
    {
        question: 'What is the meaning of success?',
        answer: 1,
        options: [
            { id: 1, answer: 'A good book' },
            { id: 2, answer: 'JavaScript' },
            { id: 3, answer: 'Travel' },
            { id: 4, answer: 'C#' },
        ],
    },
    {
        question: 'What is the meaning of success?',
        answer: 4,
        options: [
            { id: 1, answer: 'Java' },
            { id: 2, answer: 'Friendship' },
            { id: 3, answer: 'Travel' },
            { id: 4, answer: 'Tacos' },
        ],
    },
    {
        question: 'What is the meaning of love?',
        answer: 3,
        options: [
            { id: 1, answer: 'Hard work' },
            { id: 2, answer: 'Friendship' },
            { id: 3, answer: 'Python' },
            { id: 4, answer: 'C#' },
        ],
    },
    {
        question: 'What is the meaning of happiness?',
        answer: 3,
        options: [
            { id: 1, answer: 'A good book' },
            { id: 2, answer: 'Ice cream' },
            { id: 3, answer: 'Python' },
            { id: 4, answer: 'Music' },
        ],
    },
    {
        question: 'What is the meaning of love?',
        answer: 4,
        options: [
            { id: 1, answer: 'Hard work' },
            { id: 2, answer: 'JavaScript' },
            { id: 3, answer: 'Python' },
            { id: 4, answer: 'Tacos' },
        ],
    },
    {
        question: 'What is the meaning of success?',
        answer: 4,
        options: [
            { id: 1, answer: '42' },
            { id: 2, answer: 'Unknown' },
            { id: 3, answer: 'A mystery' },
            { id: 4, answer: 'Undefined' },
        ],
    },
    {
        question: 'What is the meaning of life?',
        answer: 4,
        options: [
            { id: 1, answer: 'Hard work' },
            { id: 2, answer: 'Persistence' },
            { id: 3, answer: 'Chocolate' },
            { id: 4, answer: 'Music' },
        ],
    },
    {
        question: 'What is the meaning of code?',
        answer: 4,
        options: [
            { id: 1, answer: '42' },
            { id: 2, answer: 'Persistence' },
            { id: 3, answer: 'Python' },
            { id: 4, answer: 'Undefined' },
        ],
    },
    {
        question: 'What is the meaning of success?',
        answer: 1,
        options: [
            { id: 1, answer: 'Java' },
            { id: 2, answer: 'Unknown' },
            { id: 3, answer: 'Python' },
            { id: 4, answer: 'Music' },
        ],
    },
    {
        question: 'What is the meaning of love?',
        answer: 1,
        options: [
            { id: 1, answer: '42' },
            { id: 2, answer: 'Unknown' },
            { id: 3, answer: 'Travel' },
            { id: 4, answer: 'C#' },
        ],
    },
    {
        question: 'What is the meaning of love?',
        answer: 3,
        options: [
            { id: 1, answer: 'Hard work' },
            { id: 2, answer: 'Unknown' },
            { id: 3, answer: 'Chocolate' },
            { id: 4, answer: 'Tacos' },
        ],
    },
    {
        question: 'What is the meaning of success?',
        answer: 1,
        options: [
            { id: 1, answer: 'Pizza' },
            { id: 2, answer: 'Ice cream' },
            { id: 3, answer: 'A mystery' },
            { id: 4, answer: 'Tacos' },
        ],
    },
    {
        question: 'What is the meaning of code?',
        answer: 1,
        options: [
            { id: 1, answer: '42' },
            { id: 2, answer: 'Friendship' },
            { id: 3, answer: 'Learning' },
            { id: 4, answer: 'Innovation' },
        ],
    },
    {
        question: 'What is the meaning of love?',
        answer: 4,
        options: [
            { id: 1, answer: 'Java' },
            { id: 2, answer: 'JavaScript' },
            { id: 3, answer: 'Learning' },
            { id: 4, answer: 'C#' },
        ],
    },
    {
        question: 'What is the meaning of life?',
        answer: 1,
        options: [
            { id: 1, answer: 'Java' },
            { id: 2, answer: 'Persistence' },
            { id: 3, answer: 'A mystery' },
            { id: 4, answer: 'Innovation' },
        ],
    },
    {
        question: 'What is the meaning of life?',
        answer: 1,
        options: [
            { id: 1, answer: 'Pizza' },
            { id: 2, answer: 'Friendship' },
            { id: 3, answer: 'Learning' },
            { id: 4, answer: 'Undefined' },
        ],
    },
    {
        question: 'What is the meaning of happiness?',
        answer: 1,
        options: [
            { id: 1, answer: '42' },
            { id: 2, answer: 'Ice cream' },
            { id: 3, answer: 'Learning' },
            { id: 4, answer: 'C#' },
        ],
    },
    {
        question: 'What is the meaning of life?',
        answer: 4,
        options: [
            { id: 1, answer: '42' },
            { id: 2, answer: 'JavaScript' },
            { id: 3, answer: 'Learning' },
            { id: 4, answer: 'Music' },
        ],
    },
    {
        question: 'What is the meaning of success?',
        answer: 2,
        options: [
            { id: 1, answer: 'Java' },
            { id: 2, answer: 'Unknown' },
            { id: 3, answer: 'A mystery' },
            { id: 4, answer: 'C#' },
        ],
    },
    {
        question: 'What is the meaning of love?',
        answer: 1,
        options: [
            { id: 1, answer: 'Hard work' },
            { id: 2, answer: 'JavaScript' },
            { id: 3, answer: 'Python' },
            { id: 4, answer: 'Innovation' },
        ],
    },
    {
        question: 'What is the meaning of love?',
        answer: 1,
        options: [
            { id: 1, answer: 'Java' },
            { id: 2, answer: 'Unknown' },
            { id: 3, answer: 'A mystery' },
            { id: 4, answer: 'Undefined' },
        ],
    },
    {
        question: 'What is the meaning of code?',
        answer: 3,
        options: [
            { id: 1, answer: 'A good book' },
            { id: 2, answer: 'Persistence' },
            { id: 3, answer: 'Chocolate' },
            { id: 4, answer: 'Undefined' },
        ],
    },
    {
        question: 'What is the meaning of happiness?',
        answer: 2,
        options: [
            { id: 1, answer: 'Hard work' },
            { id: 2, answer: 'Persistence' },
            { id: 3, answer: 'Chocolate' },
            { id: 4, answer: 'Innovation' },
        ],
    },
    {
        question: 'What is the meaning of happiness?',
        answer: 1,
        options: [
            { id: 1, answer: 'A good book' },
            { id: 2, answer: 'Ice cream' },
            { id: 3, answer: 'Learning' },
            { id: 4, answer: 'Music' },
        ],
    },
    {
        question: 'What is the meaning of success?',
        answer: 1,
        options: [
            { id: 1, answer: 'Pizza' },
            { id: 2, answer: 'Friendship' },
            { id: 3, answer: 'Travel' },
            { id: 4, answer: 'Undefined' },
        ],
    },
    {
        question: 'What is the meaning of love?',
        answer: 3,
        options: [
            { id: 1, answer: '42' },
            { id: 2, answer: 'Ice cream' },
            { id: 3, answer: 'A mystery' },
            { id: 4, answer: 'C#' },
        ],
    },
    {
        question: 'What is the meaning of success?',
        answer: 2,
        options: [
            { id: 1, answer: 'Pizza' },
            { id: 2, answer: 'Friendship' },
            { id: 3, answer: 'Travel' },
            { id: 4, answer: 'Tacos' },
        ],
    },
];

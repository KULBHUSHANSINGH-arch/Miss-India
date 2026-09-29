<?php
// Two starter posts so the blog is not empty on first launch.

function seed_posts(): array
{
    $yesterday = gmdate('Y-m-d H:i:s', time() - 86400);
    $now = gmdate('Y-m-d H:i:s');
    return [
        [
            'id' => uuid4(),
            'slug' => 'registrations-open-mr-miss-mrs-india-2026',
            'type' => 'news',
            'title' => 'Registrations Open for Mr. Miss. & Mrs. India 2026',
            'excerpt' => "Global India's Biggest Beauty Pageant is back — a premium pageant & fashion show for freshers and professional models aged 15 to 45.",
            'category' => 'Announcements',
            'coverImage' => '/images/runway-blue.jpeg',
            'status' => 'published',
            'blocks' => [
                ['type' => 'paragraph', 'text' => "Presented by Vaibhav Jan Samriddhi Foundation, Global India's Biggest Beauty Pageant — Mr. Miss. & Mrs. India 2026 — is now accepting registrations from across the country."],
                ['type' => 'heading', 'level' => 2, 'text' => 'Key Dates'],
                ['type' => 'paragraph', 'text' => "Live Audition / Grooming: 25 November 2026\nGrand Finale: 18 December 2026\nVenue: 5 Star Radisson Hotel, Agra"],
                ['type' => 'image', 'url' => '/images/runway-wine.jpeg', 'caption' => 'Grace, confidence and beauty with a purpose.'],
                ['type' => 'heading', 'level' => 2, 'text' => 'What Your Registration Includes'],
                ['type' => 'paragraph', 'text' => 'Grooming sessions, designer outfits, professional makeup and food are all included. Two exciting rounds, two designer outfits and professional makeup are provided by the organizers.'],
                ['type' => 'quote', 'text' => 'Your journey to the crown begins here.', 'author' => 'Team Miss India 2026'],
            ],
            'createdAt' => $yesterday,
            'updatedAt' => $yesterday,
        ],
        [
            'id' => uuid4(),
            'slug' => 'royal-journey-taj-mahal-agra-fort-mathura-vrindavan',
            'title' => 'A Royal Journey: Taj Mahal, Agra Fort, Mathura & Vrindavan',
            'excerpt' => 'Beyond the ramp — every celebrity and contestant will visit the Taj Mahal and Agra Fort, and will also be taken to Mathura and Vrindavan.',
            'category' => 'Experiences',
            'coverImage' => '/images/runway-blush.jpeg',
            'status' => 'published',
            'blocks' => [
                ['type' => 'paragraph', 'text' => 'Mr. Miss. & Mrs. India 2026 is more than a pageant. All male and female celebrities and contestants will visit the Taj Mahal and the Agra Fort, and will also be taken to see Mathura and Vrindavan.'],
                ['type' => 'heading', 'level' => 2, 'text' => 'Heritage Meets Glamour'],
                ['type' => 'paragraph', 'text' => 'From heritage walks to the grand finale at the 5 Star Radisson Hotel, Agra, every moment is designed to be a Glam & Glory experience — with LIVE coverage and an exclusive red carpet.'],
            ],
            'createdAt' => $now,
            'updatedAt' => $now,
        ],
    ];
}

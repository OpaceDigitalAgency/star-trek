// This file would define the Sanity.io schema for your project
export const schemaTypes = [
  {
    name: 'series',
    title: 'Series',
    type: 'document',
    fields: [
      {
        name: 'title',
        title: 'Title',
        type: 'string',
        validation: Rule => Rule.required()
      },
      {
        name: 'slug',
        title: 'Slug',
        type: 'slug',
        options: {
          source: 'title',
          maxLength: 96
        },
        validation: Rule => Rule.required()
      },
      {
        name: 'abbreviation',
        title: 'Abbreviation',
        type: 'string',
        description: 'E.g., TOS, TNG, DS9'
      },
      {
        name: 'releaseYears',
        title: 'Release Years',
        type: 'string',
        description: 'E.g., 1966-1969'
      },
      {
        name: 'stardateYears',
        title: 'Stardate Years',
        type: 'string',
        description: 'In-universe years, e.g., 2265-2269'
      },
      {
        name: 'seasons',
        title: 'Number of Seasons',
        type: 'number'
      },
      {
        name: 'episodes',
        title: 'Number of Episodes',
        type: 'number'
      },
      {
        name: 'description',
        title: 'Description',
        type: 'text'
      },
      {
        name: 'poster',
        title: 'Poster Image',
        type: 'image',
        options: {
          hotspot: true
        }
      },
      {
        name: 'heroImage',
        title: 'Hero Image',
        type: 'image',
        options: {
          hotspot: true
        }
      },
      {
        name: 'order',
        title: 'Chronological Order',
        type: 'number',
        description: 'Used for timeline sorting'
      }
    ]
  },
  {
    name: 'season',
    title: 'Season',
    type: 'document',
    fields: [
      {
        name: 'title',
        title: 'Title',
        type: 'string',
        validation: Rule => Rule.required()
      },
      {
        name: 'series',
        title: 'Series',
        type: 'reference',
        to: [{type: 'series'}],
        validation: Rule => Rule.required()
      },
      {
        name: 'number',
        title: 'Season Number',
        type: 'number',
        validation: Rule => Rule.required()
      },
      {
        name: 'releaseYear',
        title: 'Release Year',
        type: 'string'
      },
      {
        name: 'episodes',
        title: 'Number of Episodes',
        type: 'number'
      },
      {
        name: 'description',
        title: 'Description',
        type: 'text'
      },
      {
        name: 'poster',
        title: 'Season Poster',
        type: 'image',
        options: {
          hotspot: true
        }
      }
    ]
  },
  {
    name: 'episode',
    title: 'Episode',
    type: 'document',
    fields: [
      {
        name: 'title',
        title: 'Title',
        type: 'string',
        validation: Rule => Rule.required()
      },
      {
        name: 'season',
        title: 'Season',
        type: 'reference',
        to: [{type: 'season'}],
        validation: Rule => Rule.required()
      },
      {
        name: 'series',
        title: 'Series',
        type: 'reference',
        to: [{type: 'series'}]
      },
      {
        name: 'episodeNumber',
        title: 'Episode Number',
        type: 'number',
        validation: Rule => Rule.required()
      },
      {
        name: 'productionCode',
        title: 'Production Code',
        type: 'string'
      },
      {
        name: 'airDate',
        title: 'Air Date',
        type: 'date'
      },
      {
        name: 'stardate',
        title: 'Stardate',
        type: 'string'
      },
      {
        name: 'earthYear',
        title: 'Earth Year',
        type: 'number',
        description: 'The in-universe year the episode takes place'
      },
      {
        name: 'synopsis',
        title: 'Synopsis',
        type: 'text'
      },
      {
        name: 'stillImage',
        title: 'Still Image',
        type: 'image',
        options: {
          hotspot: true
        }
      },
      {
        name: 'director',
        title: 'Director',
        type: 'string'
      },
      {
        name: 'writer',
        title: 'Writer',
        type: 'string'
      },
      {
        name: 'featuredCharacters',
        title: 'Featured Characters',
        type: 'array',
        of: [
          {
            type: 'reference',
            to: [{type: 'character'}]
          }
        ]
      },
      {
        name: 'timelineConnections',
        title: 'Timeline Connections',
        type: 'array',
        of: [
          {
            type: 'reference',
            to: [{type: 'episode'}, {type: 'character'}, {type: 'event'}]
          }
        ],
        description: 'Connect this episode to related episodes, characters, or events in the timeline'
      }
    ]
  },
  {
    name: 'character',
    title: 'Character',
    type: 'document',
    fields: [
      {
        name: 'name',
        title: 'Name',
        type: 'string',
        validation: Rule => Rule.required()
      },
      {
        name: 'slug',
        title: 'Slug',
        type: 'slug',
        options: {
          source: 'name',
          maxLength: 96
        },
        validation: Rule => Rule.required()
      },
      {
        name: 'portrayer',
        title: 'Portrayed By',
        type: 'string'
      },
      {
        name: 'image',
        title: 'Character Image',
        type: 'image',
        options: {
          hotspot: true
        }
      },
      {
        name: 'bio',
        title: 'Biography',
        type: 'text'
      },
      {
        name: 'species',
        title: 'Species',
        type: 'string'
      },
      {
        name: 'rank',
        title: 'Rank/Position',
        type: 'string'
      },
      {
        name: 'affiliations',
        title: 'Affiliations',
        type: 'array',
        of: [{type: 'string'}]
      },
      {
        name: 'series',
        title: 'Series Appearances',
        type: 'array',
        of: [
          {
            type: 'reference',
            to: [{type: 'series'}]
          }
        ]
      }
    ]
  },
  {
    name: 'event',
    title: 'Timeline Event',
    type: 'document',
    fields: [
      {
        name: 'title',
        title: 'Event Title',
        type: 'string',
        validation: Rule => Rule.required()
      },
      {
        name: 'slug',
        title: 'Slug',
        type: 'slug',
        options: {
          source: 'title',
          maxLength: 96
        },
        validation: Rule => Rule.required()
      },
      {
        name: 'year',
        title: 'Year',
        type: 'number',
        description: 'The in-universe year of the event',
        validation: Rule => Rule.required()
      },
      {
        name: 'description',
        title: 'Description',
        type: 'text',
        validation: Rule => Rule.required()
      },
      {
        name: 'image',
        title: 'Event Image',
        type: 'image',
        options: {
          hotspot: true
        }
      },
      {
        name: 'impact',
        title: 'Historical Impact',
        type: 'text',
        description: 'The significance of this event in Star Trek history'
      },
      {
        name: 'relatedEpisodes',
        title: 'Related Episodes',
        type: 'array',
        of: [
          {
            type: 'reference',
            to: [{type: 'episode'}]
          }
        ]
      },
      {
        name: 'relatedCharacters',
        title: 'Related Characters',
        type: 'array',
        of: [
          {
            type: 'reference',
            to: [{type: 'character'}]
          }
        ]
      },
      {
        name: 'era',
        title: 'Timeline Era',
        type: 'string',
        options: {
          list: [
            {title: 'Pre-Federation', value: 'pre-federation'},
            {title: 'Early Federation', value: 'early-federation'},
            {title: 'Constitution Class Era', value: 'constitution-era'},
            {title: 'Mid Federation', value: 'mid-federation'},
            {title: 'Galaxy Class Era', value: 'galaxy-era'},
            {title: 'Post-Nemesis Era', value: 'post-nemesis'},
            {title: '32nd Century', value: '32nd-century'}
          ]
        }
      }
    ]
  }
];
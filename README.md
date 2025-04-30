# Word Frequency

Word Frequency is a plugin for [Obsidian.md](https://obsidian.md/) that counts
the words in the current note and displays word frequency counts in the sidebar.

## Description

Use Word Frequency to identify keywords within a note that can later serve for
SEO, résumé skills, or general writing. Use the blacklist feature to hide and
ignore words from the counts and display.

## How to Use

The words and their frequency counts display in descending order, having the
most common word at the top and the least common word at the bottom. Special
characters do not count as part of the word.

### Active the Counter

On the ribbon (typically on the left side of the desktop window), select the 
`Show word frequency sidebar` icon that looks like a paper with a bar chart.

Alternatively, open the Command Palette, type `Show word frequency sidebar`, and
select the `Word Frequency: Show word frequency sidebar` option.

This should open and display the sidebar (typically on the right side of the
desktop window) with the word counts. If the words and counts do not display,
click inside a note so the plugin knows which note to use.

### Filtering Words

Use the text input field at the top of the sidebar to filter the list of words.
Only words containing the characters in the input field will display in the list
with their counts.

Clear the text input field to reset the filter and display all available words.

### Ignore Specific Words

When browsing the display of words and their frequency counts, click the trash
can icon to add that word to the blacklist or ignore list. This word will no
longer display in the sidebar.

The blacklist is adjustable through the Settings interface.

### Seeing the Current Frequency Threshold

Some words should be part of the counts, and they might not appear often enough
to warrant a place in the display. For those situations, notice at the bottom of
the sidebar display, below the list of words, is the
`Current Frequency Threshold`. Words in the note content must occur at least as
many times as the frequency threshold to display in the sidebar.

The frequency threshold is adjustable through the Settings interface.

## Settings

There are currently two settings for this plugin.

1. Blacklist Words
2. Frequency Threshold

### Blacklist Words

The plugin has some words set as default blacklist words, like `the`, `and`, and
`to`. Use the text area to add or remove words to the list.

When clicking the trash can button in the sidebar, the plugin adds the word in
that row to the end of this list. In case of a mistake, remove the word from the
settings text area.

### Frequency Threshold

This limits the results in the sidebar such that the word must occur at least as
many times as the frequency threshold.

The default frequency threshold is 3, and is easily changeable. For large notes,
consider using a threshold of 10 or more.

## Future Development

The plugin is fully functional. To assist people more with its use, here are
some ideas for the developers to implement.

- [x] add word search filter
- [ ] add maximum display count for sidebar

## Contributing

If you'd like to contribute to the development of this plugin, fork the
repository and submit a pull request.

Ensure the code has sufficient tests.

## Issues

If there are any issues or problems with the plugin, create an
[issue](https://github.com/mts7/obsidian-word-frequency/issues) if the issue
does not already exist.

## Support

The hours that go into the design, development, and testing of plugins is often
overlooked. If this plugin helps you or you are feeling generous today, please
consider supporting my development through a donation. Every little bit helps.

[![Become a GitHub Sponsor](https://img.shields.io/github/sponsors/mts7?label=Sponsor&logo=GitHub%20Sponsors&style=for-the-badge)](https://github.com/sponsors/mts7)

[![Buy Me a Coffee](__assets__/bmc-button.png)](https://www.buymeacoffee.com/mts7)

## Origin Story

Obsidian is a great and powerful note-taking tool that has many amazing plugins
to help people use Obsidian better. Compiling a list of keywords within a note
was not doable, so someone needed to create a plugin to count the words in a
note and display their counts in the sidebar, and I am that someone.

To determine a good skill list for a résumé, gather the qualifications or
requirements from 10-15 jobs, and find the most commonly used words within those
job descriptions. Of course, filter out the words that do not need to be in a
skills section, like `experience`. Having all these descriptions in a single
note allows the chance for a plugin to scan the note and display all keywords or
skills to include in the résumé.

With Word Frequency, finding skills for a résumé is as easy as pasting
qualifications from job descriptions into a single note, putting spaces around
the slashes (since the plugin removes `/` and merges words together such that 
`CI/CD` becomes `CICD`), and activating the plugin.

The words and their frequency counts display immediately on the sidebar,
allowing easy access to see which words show up the most, and making keyword
tracking quicker.

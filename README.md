# An MTG card search App

This app is designed to provide awesome and quick Magic The Gathering card searching.
It scrapes [gatherer](http://gatherer.wizards.com/Pages/Default.aspx), in order to populate a mongo database.

It's designed to find the cards you want with the least time and effort.
When you search, the site autodetects card names, colours, types, subtypes, expansions, formats and rarities.
It also supports keywords such as permanents, nonlands, noncreature, multicoloured and colorless cards
Use quotes to search for specific rules.

## TODO

 - Add card numbers
 - Make artist table
 - Implement card removals correction
 - Fix Who // What // When // Where // Why
 - Invalidate request cache in a timely manner
 - When searching by expansion, show printing for that expansion
 - Apply legality for current format
 - Add checkbox to exclude un-sets by default
 - Rewrite front-end
 - Save block/expansion relationships
 - Store images on S3
 - Fix flavour text missing newlines
 - Mark un-set cards and remove from search
 - Mark tokens and remove from search
 - Support multipart cards on frontend
 - Improve matching for punctuation in names, rules
 - Crawl rulings

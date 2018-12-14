# An MTG card search App

This app is designed to provide awesome and quick Magic The Gathering card searching.
It scrapes [gatherer](http://gatherer.wizards.com/Pages/Default.aspx), in order to populate a mongo database.

It's designed to find the cards you want with the least time and effort.
When you search, the site autodetects card names, colours, types, subtypes, expansions, formats and rarities.
It also supports keywords such as permanents, nonlands, noncreature, multicoloured and colorless cards
Use quotes to search for specific rules.

## TODO

 - When searching by expansion, show printing for expansion
 - Fix issue with Slaughter Pact et. al duplicate colours
 - Fix subtype detection (un-sets)
 - Apply legality for current format
 - Add checkbox to exclude un-sets by default
 - Rewrite front-end
 - Better handling of request and save failure
 - Save block/expansion relationships
 - Store images on S3
 - Fix fixture cards overwriting printings
 - Fix flavour text missing newlines
 - Mark un-set cards and remove from search
 - Update corrections to use a standard, closure format
 - Mark tokens and remove from search
 - Support multipart cards on frontend
 - Add details to unglued token cards, if applicable
 - Improve matching for punctuation in names, rules
 - Add gatherer name, fix token naming
 - Crawl rulings

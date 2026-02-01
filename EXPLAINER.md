# Playto Backend Explainer

## The Tree: Handling Nested Comments without N+1

For threaded comments, I used a standard Adjacency List model (`parent` ForeignKey to `self`).
To avoid the N+1 problem (fetching comments recursively):

1. I fetch **all** comments for a post in a single query: `Comment.objects.filter(post=post).select_related('author')`.
2. I reconstruct the tree in memory in Python `O(N)` time using a hash map (`id -> comment object`).
3. The serializer is recursive but expects a pre-computed `_replies` list on each comment object, preventing it from hitting the database again.

**Result**: Fetching a post with N comments always results in exactly **2 queries** (1 for Post, 1 for Comments), regardless of depth. Verified in `test_n_plus_one_compliance`.

## The Math: Leaderboard Query

The Leaderboard requires calculating karma _earned_ in the last 24 hours.

- 1 Like on Post = 5 Karma
- 1 Like on Comment = 1 Karma

To calculate this dynamically without storing counters on the User model, and to avoid cross-product issues when joining both Posts and Comments, I used Django `Subquery`.

```python
posts_karma_sq = Subquery(
    Post.objects.filter(author=OuterRef('pk'))
    .values('author') # Group by author inside subquery
    .annotate(
        s=Sum(
            Case(When(likes__created_at__gte=cutoff, then=5), default=0, output_field=IntegerField())
        )
    )
    .values('s')
)

comments_karma_sq = Subquery(
    Comment.objects.filter(author=OuterRef('pk'))
    .values('author')
    .annotate(
        s=Sum(
            Case(When(likes__created_at__gte=cutoff, then=1), default=0, output_field=IntegerField())
        )
    )
    .values('s')
)

queryset = User.objects.annotate(
    score=Coalesce(posts_karma_sq, Value(0)) + Coalesce(comments_karma_sq, Value(0))
).filter(score__gt=0).order_by('-score')[:5]
```

## The AI Audit: Fixing Buggy Code

**The Bug**: Initially, I wrote a query that tried to `Sum` an already aggregated field inside a `Subquery` incorrectly, or tried to join generic relations without proper setup. Also, the first attempt at Leaderboard logic in my test case revealed I was checking who _gave_ likes instead of who _received_ them (checking `user.likes` vs `post.likes`).

**The Fix**:

1. Added `GenericRelation` to `Post` and `Comment` models to allow reverse lookups from `Like`.
2. Rewrote the Leaderboard query to use `Subquery` correctly via `OuterRef` on the Author, ensuring we sum the likes on the _content authored by the user_.
3. Fixed the `views.py` code where `post_score` was being summed again redundantly, which caused `FieldError: Cannot compute Sum('post_score'): 'post_score' is an aggregate`.
